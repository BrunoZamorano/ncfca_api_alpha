# Plano de Execução — Correção do Carregamento de Variáveis de Ambiente para Testes

## Objetivo
O objetivo desta iniciativa é corrigir a forma como as variáveis de ambiente são carregadas durante a execução dos testes end-to-end (E2E). Implementaremos uma solução robusta e centralizada utilizando o módulo `@nestjs/config`, garantindo que os testes utilizem o arquivo `.env.test` de forma previsível e isolada.

## Escopo
- **Incluído:**
  - Instalação e configuração do módulo `@nestjs/config`.
  - Refatoração completa da aplicação (`main.ts`, serviços, módulos, etc.) para remover o acesso direto a `process.env` e utilizar o `ConfigService`.
  - Atualização do script de teste `test:e2e` no `package.json`.
- **Excluído:**
  - Alterações em qualquer outra lógica de negócio ou de teste que não a refatoração do acesso à configuração.
  - Introdução de validação de schema para as variáveis de ambiente.

## Referências
- **Doc do Arquiteto:** @/tasks/analisys/08-fix-test-env-loading.analisys.md
- **Context7:** `@nestjs/config` v4.0.2

## Tasks
1. **01** — Instalar e Configurar o `@nestjs/config`
2. **02** — Refatorar `main.ts` para Utilizar o `ConfigService`
3. **03** — Refatorar Serviços e Módulos para Utilizar o `ConfigService`
4. **04** — Atualizar Script de Teste e Verificar a Solução