status: completed

# Task 01 — Estruturar o Ambiente de Teste E2E para o Módulo Club

## Objetivo
Criar a infraestrutura básica para os testes E2E do `ClubController`, incluindo o diretório, o arquivo de setup com helpers e a documentação inicial. Esta base será usada nas tasks seguintes para implementar os testes das rotas.

## Arquivos e Caminhos
- **Criar diretório:** `test/club/`
- **Criar arquivo:** `test/club/setup.ts`
- **Criar arquivo:** `test/club/README.md`

## Contratos e Estruturas (`test/club/setup.ts`)

- **`setupClubApp()`**: 
  - **Descrição:** Inicializa o `TestingModule` do NestJS para o escopo do clube, importando o `AppModule` e aplicando as configurações necessárias para um ambiente de teste.
  - **Retorno:** `{ app: INestApplication, prisma: PrismaClient }`.

- **`createTestUser(app, prisma, roles)`**: 
  - **Descrição:** Helper para criar um usuário de teste com família e afiliação ativas.
  - **Parâmetros:** `app`, `prisma`, `roles: UserRoles[]`.
  - **Retorno:** Objeto com dados do usuário e token de acesso. Ex: `{ userId, familyId, affiliationId, accessToken }`.

- **`createTestClub(prisma, ownerId, clubData)`**:
  - **Descrição:** Helper para criar um clube de teste associado a um proprietário.
  - **Parâmetros:** `prisma`, `ownerId: string`, `clubData: Partial<ClubDto>`.
  - **Retorno:** O clube criado.

- **`clubCleanup(prisma, userIds)`**:
  - **Descrição:** Realiza a limpeza cirúrgrica dos dados criados, removendo clubes, famílias e usuários com base nos IDs fornecidos.
  - **Parâmetros:** `prisma`, `userIds: string[]`.

## Passo a Passo
1.  Crie o diretório `test/club`.
2.  Dentro de `test/club`, crie o arquivo `setup.ts`.
3.  Implemente a função `setupClubApp` em `setup.ts`, baseando-se no exemplo de `test/club-management/setup.ts`. Ela deve compilar o `AppModule` e retornar a `app` e o `prisma`.
4.  Implemente as funções `createTestUser` e `createTestClub` para gerar os dados necessários para os testes.
5.  Implemente a função `clubCleanup` para garantir a limpeza dos dados após a execução dos testes.
6.  Crie o arquivo `test/club/README.md`.
7.  Documente no `README.md` o propósito da suíte de testes, como usar as funções do `setup.ts` e quais rotas serão cobertas.

## Critérios de Aceite
- O diretório `test/club/` e os arquivos `setup.ts` e `README.md` foram criados.
- As funções em `setup.ts` estão implementadas e exportadas corretamente.
- O `README.md` documenta claramente a estrutura e o propósito dos testes do módulo Club.

## Notas de versão/refs do Context7
- **NestJS Testing:** `/nestjs/docs.nestjs.com` (v11.1.6)
- **Prisma Client:** A ser usado para cleanup.
