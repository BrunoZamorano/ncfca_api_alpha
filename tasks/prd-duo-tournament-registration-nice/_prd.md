# Product Requirements Document: Registro de Duplas em Torneios

**Autor:** Gemini
**Versão:** 1.0

## 1. Visão Geral

Em 2025, a NCFCA expandirá seus torneios de debate online para além dos Estados Unidos. Para permitir que dependentes de outros países participem, precisamos de uma integração que permita que seus responsáveis (Holders) os registrem em torneios de duplas através da nossa plataforma. Já implementamos o gerenciamento de torneios e o registro individual. Nossa missão agora é analisar, planejar e implementar o processo de registro para duplas, que envolve um fluxo de convite e aceitação entre dois Holders diferentes.

## 2. Metas e Objetivos

1.  Permitir que Holders solicitem a inscrição de um de seus Dependentes em torneios de DUPLAS, convidando um parceiro.
2.  Criar um processo de confirmação em duas etapas para o registro de duplas:
    *   **Etapa 1: Solicitação.** O Holder do solicitante inicia o processo, criando uma pendência para o Holder do parceiro.
    *   **Etapa 2: Confirmação.** O Holder do parceiro aceita ou recusa o convite, completando ou cancelando o registro.
3.  Garantir que a implementação siga os padrões de arquitetura e código do projeto, incluindo o uso de CQRS, eventos de domínio e testes E2E.

### Métricas de Sucesso

*   **Adoção da Funcionalidade:** 100% dos fluxos principais (solicitar registro, visualizar pendências, aceitar/recusar convite) estão funcionais e acessíveis aos Holders.
*   **Saúde do Sistema:** Todos os eventos de domínio (`DuoRegistration.Requested`, `DuoRegistration.Accepted`, etc.) são emitidos e tratados corretamente pelos seus respectivos listeners.
*   **Qualidade do Código:** 100% de aprovação nos testes unitários e E2E. O código está em conformidade com as regras definidas em `@.cursor/rules/code-standards.mdc`.

## 3. Histórias de Usuário

*   **Como um Holder (solicitante),** eu quero selecionar um dos meus Dependentes e convidar um parceiro (selecionando-o de uma lista), para que eu possa iniciar o registro em um torneio de duplas.
*   **Como um Holder (do parceiro),** eu quero ver os convites de registro pendentes para meus Dependentes e aceitá-los, para que meus Dependentes possam participar do torneio.
*   **Como um Holder (do parceiro),** eu quero recusar um convite de registro, para que meu Dependente não seja inscrito em um torneio que eu não aprovo.
*   **Como um Holder (solicitante),** eu quero ver o status dos meus convites enviados (pendente, aceito, recusado), para que eu saiba o andamento do registro.
*   **Como um Holder (solicitante),** eu quero poder cancelar um convite pendente que enviei, para que eu possa corrigir um erro ou escolher um novo parceiro.

## 4. Requisitos Funcionais

### RF1: Descoberta de Dependentes
*   **RF1.1:** O sistema DEVE fornecer um endpoint (via query CQRS) que retorna uma lista de todos os Dependentes (`id` + `email`), acessível a qualquer Holder autenticado (perfil `SEM_FUNCAO`).

### RF2: Solicitação de Registro de Dupla
*   **RF2.1:** Um Holder DEVE poder submeter uma solicitação de registro de dupla especificando o `tournamentId`, o `requesterId` (seu Dependente) e o `partnerId` (o Dependente parceiro).
*   **RF2.2:** Após a submissão, o sistema DEVE criar uma entidade `Registration` com o status `PENDING`.
*   **RF2.3:** O sistema DEVE emitir um evento de domínio `DuoRegistration.Requested`.

### RF3: Gerenciamento de Solicitações Pendentes
*   **RF3.1:** Um Holder DEVE poder consultar uma lista de todos os convites de registro pendentes onde um de seus Dependentes é o parceiro convidado.
*   **RF3.2:** O Holder solicitante DEVE poder consultar o status de seus convites enviados, incluindo o motivo em caso de falha ou recusa.
*   **RF3.3:** O Holder solicitante DEVE poder cancelar um convite com status `PENDING` que ele enviou. Se cancelado, o status da `Registration` muda para `CANCELLED`.

### RF4: Confirmação de Registro (Aceite)
*   **RF4.1:** O Holder do parceiro DEVE poder aceitar um convite de registro pendente.
*   **RF4.2:** Ao aceitar, o status da `Registration` DEVE mudar para `CONFIRMED`.
*   **RF4.3:** O sistema DEVE usar o `optimistic-lock` na entidade `Tournament` para prevenir inscrições além do limite. Se o torneio estiver cheio no momento da aceitação, a operação DEVE falhar e retornar o motivo "Torneio lotado".
*   **RF4.4:** O sistema DEVE emitir um evento de domínio `DuoRegistration.Accepted`.

### RF5: Recusa de Registro
*   **RF5.1:** O Holder do parceiro DEVE poder recusar um convite de registro pendente.
*   **RF5.2:** Ao recusar, o status da `Registration` DEVE mudar para `REJECTED`.

## 5. Requisitos Não-Funcionais
*   **Concorrência:** O sistema deve lidar com múltiplas solicitações simultâneas de forma segura, utilizando o `optimistic-lock` para garantir a integridade dos dados.
*   **Arquitetura:** A implementação deve seguir o padrão CQRS, separando queries (para leitura) de comandos (para escrita). Eventos de domínio devem ser utilizados para tarefas assíncronas, como a sincronização de dados.

## 6. UX & Design
*   A interface será construída com a biblioteca `shadcn/ui`.
*   As implementações de componentes devem seguir a documentação oficial, com referências ao `Context7 mcp` quando necessário.

## 7. Escopo
### Em Escopo
*   O fluxo completo de solicitação, visualização, aceitação, recusa e cancelamento de registros de duplas.
*   Criação de todos os endpoints, use cases, eventos de domínio e testes (unitários e E2E) necessários.

### Fora de Escopo (Não-Metas)
*   Serviço de notificação por e-mail.
*   Ferramenta para que Dependentes encontrem parceiros.
*   Processamento de pagamentos.
*   Requisitos específicos de performance (além do uso de queries CQRS para otimização).

## 8. Riscos e Suposições
*   **Risco:** Conflitos de concorrência (ex: dois usuários convidando o mesmo parceiro simultaneamente).
    *   **Mitigação:** Uso do `optimistic-lock` na entidade `Tournament` para controlar o número de vagas.
*   **Risco:** Problemas na sincronização de dados com a plataforma dos EUA.
    *   **Mitigação:** A lógica de sincronização será tratada de forma assíncrona por listeners de eventos de domínio, garantindo que o fluxo principal não seja impactado.
*   **Suposição:** O frontend será responsável por fornecer um `partnerId` válido, obtido através do novo endpoint de descoberta de dependentes (RF1).

## 9. Plano de Implementação (Fases)

O plano técnico detalhado no seu rascunho será organizado nas seguintes fases:

*   **Fase 1: Lógica de Domínio e Fluxo de Solicitação**
    1.  Adicionar o tipo `DUO` ao `schema.prisma` e `tournament.entity.ts`.
    2.  Implementar o método `duoRegister` na entidade `Tournament` com testes.
    3.  Criar o use case `RequestDuoRegistration` com testes.
    4.  Adicionar a rota `POST` no `TournamentController` para o registro de duplas.
    5.  Criar o endpoint de descoberta de dependentes (RF1).

*   **Fase 2: Gerenciamento de Convites Pendentes**
    1.  Implementar a query e o use case `GetMyPendingRegistrationRequests`.
    2.  Adicionar a rota `GET` no `TournamentController` para listar convites pendentes.
    3.  Implementar o método `acceptDuoRequest` na entidade `Registration` com testes.
    4.  Criar o use case `AcceptDuoRequest` com testes.
    5.  Adicionar a rota `POST` no `TournamentController` para aceitar convites.
    6.  Implementar a lógica de recusa e cancelamento de forma similar.

*   **Fase 3: Validação e Testes Finais**
    1.  Criar testes E2E abrangentes para todos os fluxos de usuário.
    2.  Executar `pnpm build` e `pnpm test` para garantir que toda a aplicação está estável.
    3.  Adicionar os handlers necessários em `tournament.listener.ts` para a sincronização via eventos.
