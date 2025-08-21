# Análise Arquitetural: Carregamento de Variáveis de Ambiente em Testes

**ID da Análise:** 08
**Título:** Correção do Carregamento de Variáveis de Ambiente para Testes E2E
**Autor:** O Arquiteto Pragmático
**Data:** 2025-08-19

---

## 1. Diagnóstico

A aplicação está utilizando a flag `--env-file=.env.test` do Node.js para tentar carregar configurações específicas para o ambiente de teste E2E. No entanto, essa abordagem se mostra ineficaz, pois o processo de bootstrap do NestJS, especialmente dentro do `Test.createTestingModule`, não herda ou respeita essas variáveis de forma consistente.

**Sintoma:** Os testes E2E se conectam a serviços externos (como RabbitMQ) definidos no `.env` principal, em vez de usar as configurações locais definidas no `.env.test`. Isso torna os testes dependentes de infraestrutura externa e não isolados.

## 2. Princípio Arquitetural Violado

O problema central é uma violação do **Gerenciamento de Configuração Explícito e Centralizado**. A configuração de uma aplicação não deve depender de mecanismos externos e implícitos ao framework. A responsabilidade de carregar e fornecer as variáveis de ambiente corretas deve ser da própria aplicação, de maneira previsível e idiomática.

## 3. Análise de Trade-offs

| Abordagem | Vantagens | Desvantagens | Risco |
| :--- | :--- | :--- | :--- |
| **Atual (`--env-file`)** | - Nenhuma alteração de código.<br>- Simples de invocar. | - Frágil e dependente da versão do Node.js.<br>- Não idiomático para o NestJS.<br>- **Não funciona como esperado.**<br>- Lógica de configuração implícita. | **Alto:** Causa comportamento imprevisível e testes não confiáveis. |
| **Proposta (`@nestjs/config`)** | - Solução robusta e idiomática.<br>- Centraliza o gerenciamento de config.<br>- Explícito e fácil de depurar.<br>- Permite validação de schema de config. | - Requer adicionar uma nova dependência.<br>- Pequena refatoração no `AppModule` e `main.ts`. | **Baixo:** Alinha o projeto às melhores práticas do NestJS, aumentando a manutenibilidade. |

## 4. Modelo Mental Proposto

A aplicação deve ser autossuficiente em relação à sua configuração. Ao iniciar, ela deve inspecionar uma variável de ambiente primária (como `NODE_ENV`) para determinar seu contexto de execução (desenvolvimento, produção, teste) e, a partir daí, carregar o conjunto correto de variáveis de configuração. Isso encapsula a lógica e torna a aplicação mais portável e previsível.

## 5. Plano de Ação

A solução consiste em adotar o módulo `@nestjs/config` para um gerenciamento de configuração robusto e integrado.

1.  **Instalar Dependência:**
    ```bash
    pnpm add @nestjs/config
    ```

2.  **Configurar `ConfigModule` no `AppModule` (`src/app.module.ts`):**
    -   Importar `ConfigModule` e configurá-lo para ser global (`isGlobal: true`).
    -   Utilizar a propriedade `envFilePath` para carregar dinamicamente `.env.test` ou `.env` com base em `process.env.NODE_ENV`.

    ```typescript
    // Exemplo de implementação
    import { ConfigModule } from '@nestjs/config';

    @Module({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
        }),
        // ... outros módulos
      ],
    })
    export class AppModule {}
    ```

3.  **Refatorar `main.ts` (Opcional, mas recomendado):**
    -   Para maior clareza, utilizar o `ConfigService` injetado para acessar as variáveis de ambiente em vez de `process.env` diretamente no `main.ts`.

    ```typescript
    // Exemplo de implementação
    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT');
    await app.listen(port);
    ```

4.  **Atualizar Script de Teste (`package.json`):**
    -   Remover a flag `--env-file` e, em seu lugar, definir a variável `NODE_ENV` que será lida pelo `ConfigModule`.

    ```json
    "scripts": {
      "test:e2e": "NODE_ENV=test jest --config ./test/jest-e2e.json"
    }
    ```

## 6. Próximos Passos

Arquivo de análise persistido em `@/tasks/analisys/08-fix-test-env-loading.analisys.md`. Cabe ao PM quebrar em tarefas para o time de desenvolvimento.
