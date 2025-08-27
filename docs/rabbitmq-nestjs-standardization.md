# Padronização da Utilização de RabbitMQ Abstraído pelo NestJS

## Visão Geral

Este documento descreve o padrão arquitetural adotado para integração com RabbitMQ no projeto NCFCA API, seguindo o fluxo: **Producer → Exchange → Queue → Consumer**. Esta padronização centraliza toda comunicação assíncrona através de microserviços NestJS e estabelece padrões claros para implementação de messaging patterns.

## Arquitetura

### Fluxo de Mensagens

```
Application → ClientProxy → RabbitMQ Exchange → Queue → Listener → Use Case
```

1. **Producers**: Usam `ClientProxy` para emitir eventos ou enviar mensagens RPC
2. **Exchanges**: Roteiam mensagens baseado em routing keys
3. **Queues**: Armazenam mensagens de forma durável até o processamento
4. **Listeners**: Controllers que processam mensagens usando `@MessagePattern` ou `@EventPattern`
5. **Use Cases**: Lógica de negócio executada pelos listeners

### Responsabilidades

- **Producers**: Emissão de eventos e requisições RPC
- **Exchanges**: Roteamento inteligente de mensagens
- **Queues**: Persistência e distribuição de mensagens
- **Listeners**: Processamento de mensagens e acknowledgement
- **Use Cases**: Execução da lógica de negócio

## Configuração Base

### Configuração no main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '@/app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Microserviço para eventos de Club Request
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL') || ''],
      queue: 'ClubRequest',
      queueOptions: {
        durable: true,
      },
      socketOptions: {
        heartbeatIntervalInSeconds: 60,
        reconnectTimeInSeconds: 5,
        clientProperties: {
          connection_name: 'ncfca-api-microservice',
        },
      },
      prefetchCount: 1,
      isGlobalPrefetch: false,
      noAck: false,
    },
  });

  // Microserviço para eventos de Tournament
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL') || ''],
      queue: 'TournamentRegistration',
      queueOptions: {
        durable: true,
      },
      socketOptions: {
        heartbeatIntervalInSeconds: 60,
        reconnectTimeInSeconds: 5,
        clientProperties: {
          connection_name: 'ncfca-api-tournament-microservice',
        },
      },
      prefetchCount: 1,
      isGlobalPrefetch: false,
      noAck: false,
    },
  });

  await app.startAllMicroservices();
  await app.listen(configService.get<number>('PORT') ?? 3000);
}

bootstrap();
```

### Configuração de Módulo Producer

```typescript
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CLUB_EVENTS_SERVICE } from '@/shared/constants/service-constants';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: CLUB_EVENTS_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL') || ''],
            queue: 'ClubRequest',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class ClubRequestModule {}
```

## Padrões de Implementação

### Event Pattern (Fire-and-Forget)

#### Producer (Emissor de Evento)

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ClientProxy } from '@nestjs/microservices';
import { RegistrationConfirmed } from '@/domain/events/registration-confirmed.event';
import { TOURNAMENT_EVENTS_SERVICE } from '@/shared/constants/service-constants';

@Injectable()
export class PublishIntegrationEventOnRegistrationConfirmed {
  constructor(@Inject(TOURNAMENT_EVENTS_SERVICE) private readonly client: ClientProxy) {}

  @OnEvent('registration.confirmed')
  handleRegistrationConfirmedEvent(event: RegistrationConfirmed): void {
    const integrationPayload = {
      registrationId: event.registrationId,
      tournamentId: event.tournamentId,
      isDuo: event.isDuo,
      participants: [
        {
          competitorId: event.competitorId,
        },
      ],
    };

    // Emite evento sem esperar resposta
    this.client.emit('registration.confirmed', integrationPayload);
  }
}
```

#### Consumer (Listener de Evento)

```typescript
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { SyncStatus } from '@prisma/client';
import { RegistrationConfirmed } from '@/domain/events/registration-confirmed.event';

@Controller()
export class TournamentListener {
  private readonly logger = new Logger(TournamentListener.name);

  constructor(private readonly prisma: PrismaService) {}

  @MessagePattern('Registration.Confirmed')
  async handleRegistrationConfirmedEvent(
    @Payload() data: RegistrationConfirmed, 
    @Ctx() context: RmqContext
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.debug(`Processando confirmação de registro: ${data.registrationId}`);

      // Executa lógica de negócio
      await this.prisma.registrationSync.update({
        where: {
          registration_id: data.registrationId,
        },
        data: {
          status: SyncStatus.SYNCED,
        },
      });

      this.logger.log(`Updated RegistrationSync status to SYNCED for registration ${data.registrationId}`);
      
      // Confirma processamento bem-sucedido
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Erro ao processar confirmação de registro ${data.registrationId}:`, error);
      
      if (error.code === 'P2025') { // Record not found
        this.logger.warn(`RegistrationSync ${data.registrationId} não encontrado. Descartando mensagem órfã.`);
        channel.ack(originalMsg);
      } else {
        this.logger.error(`Erro crítico ao processar registro ${data.registrationId}. Rejeitando mensagem.`);
        channel.nack(originalMsg, false, false);
      }
    }
  }
}
```

### Message Pattern (Request-Response)

#### Producer (Enviando RPC)

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CLUB_EVENTS_SERVICE } from '@/shared/constants/service-constants';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ClubService {
  constructor(@Inject(CLUB_EVENTS_SERVICE) private readonly client: ClientProxy) {}

  async requestClubCreation(data: CreateClubData): Promise<ClubCreatedResponse> {
    // Envia RPC e aguarda resposta
    const response$ = this.client.send<ClubCreatedResponse>('Club.Create', data);
    return await lastValueFrom(response$);
  }
}
```

#### Consumer (Processador RPC)

```typescript
import { Controller, Inject, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { ClubRequestApprovedEvent } from '@/domain/events/club-request-approved.event';
import CreateClub from '@/application/use-cases/club/create-club/create-club';

@Controller()
export class ClubEventsListener {
  private readonly logger = new Logger(ClubEventsListener.name);

  constructor(@Inject(CreateClub) private readonly createClub: CreateClub) {}

  @MessagePattern('ClubRequest.Approved')
  async handleClubRequestApproved(
    @Payload() data: ClubRequestApprovedEvent, 
    @Ctx() context: RmqContext
  ): Promise<{ club: { id: string } }> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.debug(`Processando aprovação de clube para request: ${data.requestId}`);

      const result = await this.createClub.execute({ requestId: data.requestId });

      this.logger.log(`Clube criado com sucesso: ${result.club.id} para request: ${data.requestId}`);

      channel.ack(originalMsg);
      
      // Retorna resposta para o solicitante
      return { club: { id: result.club.id } };
    } catch (error) {
      this.logger.error(`Erro ao processar aprovação de clube para request ${data.requestId}:`, error);

      if (error.name === 'EntityNotFoundException') {
        this.logger.warn(`ClubRequest ${data.requestId} não encontrado. Descartando mensagem órfã.`);
        channel.ack(originalMsg);
      } else {
        this.logger.error(`Erro crítico ao processar request ${data.requestId}. Rejeitando mensagem.`);
        channel.nack(originalMsg, false, false);
      }
      
      throw error; // Re-lança erro para RPC
    }
  }
}
```

## Gerenciamento de Erros

### Estratégias de Acknowledgement

```typescript
// ✅ Sucesso - Confirma mensagem
channel.ack(originalMsg);

// ❌ Erro recuperável - Rejeita sem requeue (vai para DLQ se configurado)
channel.nack(originalMsg, false, false);

// 🔄 Erro temporário - Rejeita com requeue (tenta novamente)
channel.nack(originalMsg, false, true);
```

### Template de Error Handling

```typescript
@MessagePattern('YourPattern')
async handleMessage(@Payload() data: YourDataType, @Ctx() context: RmqContext): Promise<void> {
  const channel = context.getChannelRef();
  const originalMsg = context.getMessage();

  try {
    // Sua lógica de negócio aqui
    await this.yourUseCase.execute(data);
    
    // Sucesso
    channel.ack(originalMsg);
  } catch (error) {
    this.logger.error(`Erro ao processar mensagem:`, error);
    
    // Categorize o erro
    if (this.isEntityNotFound(error)) {
      // Mensagem órfã - descarta
      this.logger.warn('Entidade não encontrada. Descartando mensagem órfã.');
      channel.ack(originalMsg);
    } else if (this.isTemporaryError(error)) {
      // Erro temporário - requeue
      this.logger.warn('Erro temporário. Fazendo requeue.');
      channel.nack(originalMsg, false, true);
    } else {
      // Erro permanente - vai para DLQ
      this.logger.error('Erro permanente. Enviando para DLQ.');
      channel.nack(originalMsg, false, false);
    }
  }
}

private isEntityNotFound(error: any): boolean {
  return error.name === 'EntityNotFoundException' || error.code === 'P2025';
}

private isTemporaryError(error: any): boolean {
  return error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT';
}
```

## Configurações Avançadas

### Opções Recomendadas de Transporte

```typescript
const rabbitMQOptions = {
  transport: Transport.RMQ,
  options: {
    urls: [configService.get<string>('RABBITMQ_URL') || ''],
    queue: 'YourQueueName',
    queueOptions: {
      durable: true, // Queue sobrevive a restarts
      arguments: {
        'x-message-ttl': 60000, // TTL de mensagem (ms)
        'x-max-retries': 3, // Máximo de tentativas
      },
    },
    socketOptions: {
      heartbeatIntervalInSeconds: 60,
      reconnectTimeInSeconds: 5,
      clientProperties: {
        connection_name: 'ncfca-api-service',
      },
    },
    prefetchCount: 1, // Processa uma mensagem por vez
    isGlobalPrefetch: false,
    noAck: false, // Manual acknowledgement obrigatório
  },
};
```

### Dead Letter Queue Configuration

```typescript
const queueWithDLQ = {
  queueOptions: {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': 'dlx',
      'x-dead-letter-routing-key': 'failed',
      'x-message-ttl': 60000,
      'x-max-retries': 3,
    },
  },
};
```

## Testing

### Mock do ClientProxy

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';

describe('YourService', () => {
  let service: YourService;
  let mockClient: ClientProxy;

  beforeEach(async () => {
    const mockClientProxy = {
      emit: jest.fn(),
      send: jest.fn().mockReturnValue(of({ success: true })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourService,
        {
          provide: 'YOUR_CLIENT_TOKEN',
          useValue: mockClientProxy,
        },
      ],
    }).compile();

    service = module.get<YourService>(YourService);
    mockClient = module.get<ClientProxy>('YOUR_CLIENT_TOKEN');
  });

  it('should emit event', () => {
    service.emitEvent(testData);
    
    expect(mockClient.emit).toHaveBeenCalledWith('event.pattern', testData);
  });
});
```

### Mock de Listeners

```typescript
describe('YourListener', () => {
  let listener: YourListener;
  let mockContext: RmqContext;
  let mockChannel: any;

  beforeEach(async () => {
    mockChannel = {
      ack: jest.fn(),
      nack: jest.fn(),
    };

    mockContext = {
      getChannelRef: jest.fn().mockReturnValue(mockChannel),
      getMessage: jest.fn().mockReturnValue({}),
    } as any;

    // Setup do módulo de teste...
  });

  it('should acknowledge successful processing', async () => {
    await listener.handleMessage(testData, mockContext);
    
    expect(mockChannel.ack).toHaveBeenCalled();
  });
});
```

## Estrutura de Arquivos

```
src/
├── application/
│   ├── listeners/                              # Domain event listeners
│   │   ├── publish-integration-event-on-*.listener.ts
│   │   └── create-*-on-*.listener.ts
│   └── use-cases/                              # Business logic
├── infraestructure/
│   ├── controllers/
│   │   └── listeners/                          # RabbitMQ message handlers
│   │       ├── club-events.listener.ts
│   │       └── tournament.listener.ts
│   └── database/
├── shared/
│   ├── constants/
│   │   └── service-constants.ts                # Client injection tokens
│   └── modules/                                # Module configurations
│       ├── club-request.module.ts
│       └── tournament.module.ts
└── domain/
    └── events/                                 # Event definitions
        ├── club-request-approved.event.ts
        └── registration-confirmed.event.ts
```

## Regras de Desenvolvimento

### ✅ Práticas Recomendadas

- **Sempre usar acknowledgement manual** (`noAck: false`)
- **Logs estruturados** com correlationId quando disponível
- **Timeouts configurados** para operações RPC
- **Error handling específico** baseado no tipo de erro
- **Queues duráveis** para mensagens importantes
- **Injection tokens** em constantes centralizadas
- **DTOs tipados** para payloads de mensagens
- **Unit tests** para todos os listeners e producers

### ❌ Práticas Proibidas

- `noAck: true` em produção
- Processamento síncrono longo em listeners
- Logs de payloads completos (podem conter dados sensíveis)
- Hard-coded queue names ou routing keys
- Ignorar erros sem logging adequado
- Usar `channel.ack()` em blocos catch genéricos
- Misturar lógica de negócio com lógica de messaging

### 🔧 Configurações Obrigatórias

```typescript
// ✅ Configuração correta
{
  transport: Transport.RMQ,
  options: {
    urls: [configService.get<string>('RABBITMQ_URL')],
    queue: 'WellNamedQueue',
    queueOptions: { durable: true },
    prefetchCount: 1,
    noAck: false,
  }
}

// ❌ Configuração incorreta
{
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://localhost:5672'], // Hard-coded
    queue: 'queue', // Nome genérico
    noAck: true, // Perigoso
  }
}
```

## Monitoramento

### Logs Essenciais

```typescript
// ✅ Log estruturado
this.logger.log(`Processando ${patternName} para ID: ${data.id}`, {
  pattern: patternName,
  entityId: data.id,
  correlationId: context.getMessage().properties.correlationId,
});

// ✅ Log de erro com contexto
this.logger.error(`Falha ao processar ${patternName}`, {
  error: error.message,
  stack: error.stack,
  data: JSON.stringify(data),
  messageId: context.getMessage().properties.messageId,
});
```

### Métricas Recomendadas

- Taxa de sucesso/falha por queue
- Tempo médio de processamento
- Número de mensagens em DLQ
- Latência de ponta a ponta
- Número de requeues por tipo de erro

## Checklist de Desenvolvimento

### Novos Producers
- [ ] Usa `ClientProxy` via dependency injection
- [ ] Token de injeção definido em constants
- [ ] Configurado no módulo com `ClientsModule.registerAsync()`
- [ ] Timeouts configurados para operações RPC
- [ ] Error handling implementado
- [ ] Unit tests cobrindo cenários de sucesso e falha

### Novos Listeners
- [ ] Herda de `@Controller()` 
- [ ] Usa `@MessagePattern()` ou `@EventPattern()`
- [ ] Implementa acknowledgement manual correto
- [ ] Error handling categorizado por tipo
- [ ] Logs estruturados com contexto
- [ ] Unit tests para todos os cenários
- [ ] Integration tests quando necessário

### Novos Módulos
- [ ] `ClientsModule` configurado com `registerAsync()`
- [ ] Variáveis de ambiente para URLs
- [ ] Queues duráveis configuradas
- [ ] Listeners exportados nos controllers
- [ ] Providers organizados logicamente

### Pull Requests
- [ ] Documentação de novos patterns criados
- [ ] Verificado uso correto de acknowledgements
- [ ] Tests passando com cobertura adequada
- [ ] Logs não expõem dados sensíveis
- [ ] Performance impact avaliado
- [ ] Dead letter queues configuradas quando necessário

## Comandos de Verificação

```bash
# Verificar configurações hardcoded
rg -n "amqp://|rabbitmq:" src/ --type ts

# Verificar uso de noAck: true
rg -n "noAck.*true" src/ --type ts

# Verificar listeners sem error handling
rg -l "@MessagePattern|@EventPattern" src/ | xargs rg -L "try.*catch|channel\.ack"

# Verificar logs de payloads completos
rg -n "JSON\.stringify.*payload|console\.log.*@Payload" src/ --type ts

# Verificar unit tests de listeners
find src/ -name "*.listener.ts" -exec basename {} .ts \; | sed 's/$/.spec.ts/' | xargs -I {} find . -name {} -type f
```

## Troubleshooting

### Problemas Comuns

1. **Mensagens não sendo processadas**
   - Verificar se `startAllMicroservices()` foi chamado
   - Confirmar configuração de URLs do RabbitMQ
   - Validar nomes de queues e routing keys

2. **Mensagens em loop infinito**
   - Revisar lógica de `nack` com requeue
   - Implementar limite de tentativas
   - Configurar Dead Letter Queue

3. **Performance degradada**
   - Aumentar `prefetchCount` se apropriado
   - Verificar se processamento está bloqueando
   - Monitorar uso de CPU e memória

4. **Perda de mensagens**
   - Garantir `durable: true` nas queues
   - Verificar acknowledgements corretos
   - Implementar transaction handling quando necessário

## Recursos Adicionais

- [Documentação Oficial NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [NestJs Oficial RabbitMQ Documentation](https://docs.nestjs.com/microservices/rabbitmq)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [AMQP 0.9.1 Protocol Specification](https://www.rabbitmq.com/amqp-0-9-1-reference.html)