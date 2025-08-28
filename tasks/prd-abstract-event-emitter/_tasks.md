# Implementação: Abstração do Emissor de Eventos

## Arquivos Relevantes

### Core
- `src/domain/services/event-emitter.service.ts` - Interface do emissor de eventos.
- `src/infraestructure/services/rabbitmq-event-emitter.service.ts` - Implementação com RabbitMQ.
- `src/shared/modules/event.module.ts` - Módulo de configuração centralizado.
- `src/infraestructure/messaging/microservices.config.ts` - Configuração dos consumers.

### Pontos de Integração
- `src/main.ts` - Bootstrap da aplicação.
- `src/shared/modules/club-request.module.ts` - Módulo de solicitações de clube.
- `src/shared/modules/tournament.module.ts` - Módulo de torneios.
- `src/application/listeners/*` - Listeners de eventos de domínio que disparam eventos de integração.

## Tarefas

- [ ] 1.0 Criar Interface de Domínio e Implementação de Infraestrutura
- [ ] 2.0 Criar EventModule e Centralizar Configuração do Producer
- [ ] 3.0 Centralizar Configuração do Consumer (Microserviço)
