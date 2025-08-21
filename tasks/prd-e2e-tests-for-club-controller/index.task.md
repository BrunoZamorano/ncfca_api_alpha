# Plano de Execução — Testes E2E para Club Controller

## Objetivo
Implementar uma suíte de testes End-to-End (E2E) completa para o `ClubController`, garantindo que todos os seus endpoints (`GET /club` e `GET /club/:id`) sejam validados de acordo com os padrões de teste do projeto. Isso aumentará a confiança nas alterações e prevenirá regressões.

## Escopo
- **Incluído:**
  - Criação da estrutura de testes em `test/club/`.
  - Implementação de um `setup.ts` com helpers para criação de dados e cleanup cirúrgico.
  - Testes para o endpoint de busca de clubes (`GET /club`), incluindo cenários de paginação e filtros.
  - Testes para o endpoint de obtenção de detalhes de um clube (`GET /club/:id`), incluindo cenários de sucesso e de erro (404).
  - Documentação da suíte de testes em um `README.md`.
- **Excluído:**
  - Testes para outros controllers.
  - Testes unitários ou de integração (o foco é E2E).

## Referências
- **Doc do Arquiteto:** @/tasks/analisys/010-e2e-tests-for-club-controller.analisys.md
- **Context7 MCP:**
  - NestJS Testing: `/nestjs/docs.nestjs.com` (topic: testing)
  - Supertest: `/ladjs/supertest`
  - Jest: `/jestjs/jest` (topic: testing)
- **Versões:**
  - `@nestjs/testing`: v11.1.6
  - `supertest`: v7.1.4
  - `jest`: v30.0.5

## Tasks
1. `01` — Estruturar o Ambiente de Teste E2E para o Módulo Club
2. `02` — Implementar Testes E2E para a Rota de Busca de Clubes (GET /club)
3. `03` — Implementar Testes E2E para a Rota de Detalhes do Clube (GET /club/:id)
