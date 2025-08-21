@.cursor/personas/the-arch.md
@.cursor/templates/arch-framework.md

# Tarefa: Criar testes E2E para Club Management

- Objetivo: você deve criar E2E tests para `src/infraestructure/controllers/club-management/club-management.controller.ts`, espelhando o padrão já feito para o controlador de club-request.
- Referência de exemplo: `test/club-request` (estratégia de cenários, fluxo de autenticação, limpeza cirúrgica, convenções de describe/it).
- Padrões de teste: ver `@.cursor/rules/test.standards.yml` (Arrange–Act–Assert, independência, cleanup específico, nomenclatura `(E2E)` e descrições iniciando com “Deve/Não deve”).

Escopo mínimo a cobrir (rotas e comportamentos principais):
- `GET /club-management/my-club`: Deve retornar informações do clube do diretor autenticado.
- `PATCH /club-management`: Deve atualizar dados do clube (204) e validar cenários de autorização/validação.
- `GET /club-management/my-club/enrollments`: Deve listar todas as matrículas do meu clube.
- `GET /club-management/:clubId/enrollments/pending`: Deve listar matrículas pendentes por clube (autorização por ownership).
- `POST /club-management/enrollments/:enrollmentId/approve`: Deve aprovar matrícula válida (204) e cobrir erros de domínio/permite.
- `POST /club-management/enrollments/:enrollmentId/reject`: Deve rejeitar matrícula válida (204) e validar motivos/erros.
- `GET /club-management/my-club/members`: Deve listar membros ativos do meu clube.
- `POST /club-management/membership/:membershipId/revoke`: Deve revogar afiliação (204) e validar cenários negativos.

Diretrizes:
- Reutilize utilitários e padrões do diretório `test/club-request` (setup de app, criação de usuários, autenticação, factories, limpeza cirúrgica em `afterAll`).
- Mantenha testes independentes; cada suite deve criar e remover apenas seus próprios dados (seguindo `surgical_cleanup`).
- Nomeie a suíte principal como `(E2E) ClubManagement` e os testes com descrições de regra de negócio em PT-BR.
- Evite detalhes de implementação HTTP nas descrições; foque na regra.

Entrega esperada:
- Novo diretório `test/club-management/` contendo arquivos `*.e2e-spec.ts` por caso de uso (seguindo a organização de `test/club-request`).
- Testes passando localmente via `pnpm test:e2e` (ou script equivalente definido no projeto).
