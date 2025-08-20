# Plano de Execução — 'e2e-club-management'

## Objetivo
'Especificar e guiar a implementação de testes E2E para o controlador de gestão de clubes (`ClubManagementController`), cobrindo casos felizes e negativos, seguindo o padrão existente em `test/club-request`. O foco é validar regras de negócio expostas via HTTP sem acoplar às implementações internas.'

## Escopo
- 'Incluídos: rotas do `ClubManagementController` — my-club, update, list enrollments (all e pending), approve, reject, list members, revoke membership; autenticação, autorização, validações e cleanup cirúrgico.'
- 'Excluídos: alterações em código de produção; criação de novas factories globais; truncates globais.'

## Referências
- 'Doc do Arquiteto: @/tasks/analisys/09-e2e-club-management.task.md'
- 'Padrões de teste: AI/rules/test.standards.yml'
- 'Estrutura do repo: AI/rules/folder-structure.standards.yml'
- 'Padrões de código: AI/rules/code.standards.yml'
- 'Exemplos: test/club-request/*.e2e-spec.ts'

## Tasks
1. '01 — Setup e suíte (E2E) ClubManagement'
2. '02 — Meu Clube: GET my-club e PATCH update'
3. '03 — Matrículas: listar todas e pendentes'
4. '04 — Matrículas: aprovar e rejeitar'
5. '05 — Membros: listar e revogar afiliação'

