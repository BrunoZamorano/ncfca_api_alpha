# Plano de Execução — 'fix-test-env-loading'

## Objetivo
'Garantir que os testes E2E carreguem variáveis do .env.test de forma confiável e idiomática via @nestjs/config, removendo dependência de --env-file. Centralizar configuração, habilitar leitura por NODE_ENV e reduzir risco de conexões externas acidentais.'

## Escopo
- 'Incluir @nestjs/config e torná-lo global com envFilePath dinâmico (.env/.env.test)'
- 'Refatorar src/main.ts para usar ConfigService e respeitar NODE_ENV=test (opcional: pular microservice)'
- 'Atualizar script test:e2e no package.json para NODE_ENV=test (remover --env-file)'
- 'Não incluir validação de schema de env nesta rodada'

## Referências
- 'Doc do Arquiteto: @/tasks/analisys/08-fix-test-env-loading.analisys.md'
- 'NestJS ConfigModule: @nestjs/config v3 (compatível NestJS v11)'

## Tasks
1. '01 — Introduzir ConfigModule global com envFilePath'
2. '02 — Refatorar main.ts para usar ConfigService (condicionar microservice em teste)'
3. '03 — Atualizar script test:e2e para NODE_ENV=test'

