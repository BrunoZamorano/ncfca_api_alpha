# ARQUITETURA DE TESTES E2E PARA CLUB CONTROLLER
# VERSÃO: FRAMEWORK v3.0 (modo TAG-PRIMEIRO)
# DATA: 21 de agosto de 2025

<task>
Criar uma suíte de testes End-to-End (E2E) para o `club.controller.ts`, seguindo os padrões já estabelecidos no módulo `club-management` e em conformidade com as regras de teste do projeto.
</task>

__________________________________________________________________________________________

<reference>

  <concepts_and_patterns>
    <projectCodeStandards ref="@/AI/rules/test.standards.yml" />
    <e2ePatternExample ref="@/test/club-management/README.md" />
    <patternToReplicate>Estrutura com `setup.ts` para encapsular criação de dados e cleanup cirúrgico.</patternToReplicate>
  </concepts_and_patterns>

  <filesToCreate>
    <clubE2eTestSuiteGroup purpose="Isolar e organizar os testes para o ClubController">
      <clubTestSetup path="test/club/setup.ts" role="setup" />
      <searchClubsTest path="test/club/search-clubs.e2e-spec.ts" role="test_suite" />
      <getClubInfoTest path="test/club/get-club-info.e2e-spec.ts" role="test_suite" />
      <clubTestReadme path="test/club/README.md" role="documentation" />
    </clubE2eTestSuiteGroup>
  </filesToCreate>

  <filesToAnalyze>
      <clubController path="src/infraestructure/controllers/club/club.controller.ts" role="target_controller" />
  </filesToAnalyze>

</reference>

__________________________________________________________________________________________

<as-is>

  <contextoArquitetural>
    - O <clubController> não possui testes E2E, representando uma falha na cobertura de testes da aplicação.
    - Endpoints críticos como busca (`GET /club`) e detalhamento (`GET /club/:id`) não são validados de forma automatizada.
    - Existe um padrão de testes E2E bem definido em <e2ePatternExample>, que não está sendo aplicado ao módulo de Club.
  </contextoArquitetural>

  <evidencias>
    <coberturaDeTestes>
      - Ausência do diretório `test/club/`.
      - Nenhuma execução de teste E2E para as rotas `/club` e `/club/:id` no CI/CD.
    </coberturaDeTestes>
    <risco>
      - Regressões podem ser introduzidas nos endpoints do <clubController> sem detecção automática.
      - A funcionalidade de busca, que pode envolver paginação e filtros, é complexa e propensa a erros que não são capturados por testes unitários.
    </risco>
  </evidencias>

  <consequencias>
    - Baixa confiança ao realizar alterações no <clubController> ou em seus casos de uso subjacentes.
    - Dificuldade para validar o comportamento correto da API sob a perspectiva do cliente.
  </consequencias>
</as-is>

__________________________________________________________________________________________

<to-be>
### **DECLARAÇÃO DO ESTADO FUTURO DO CÓDIGO**

<clubTestSuite>

  <designPatterns>
    <SurgicalCleanup />
    <TestSetupHelper />
    <ArrangeActAssert />
  </designPatterns>

  <tagDoSetupDeTestes state="NOVO">
    <path>test/club/setup.ts</path>
    <responsabilidade>
      - Encapsular a inicialização do `TestingModule` do NestJS para os testes do Club.
      - Prover funções utilitárias para criação de entidades necessárias (Usuários, Famílias, Clubes). Ex: `createTestUser`, `createTestClub`.
      - Implementar uma função de `clubCleanup` que realize a limpeza cirúrgica dos dados criados durante os testes, recebendo um array de `userIds`.
    </responsabilidade>
    <criteriosAceitacao>
      - Exporta uma função `setupClubApp` que retorna `{ app, prisma }`.
      - Exporta funções para criar diferentes tipos de usuários (e.g., `createRegularUser`, `createAdminUser`).
      - A função `clubCleanup` remove apenas os dados associados aos usuários de teste.
    </criteriosAceitacao>
  </tagDoSetupDeTestes>

  <tagDoTesteDeBuscaDeClubes state="NOVO">
    <path>test/club/search-clubs.e2e-spec.ts</path>
    <implements ref="<projectCodeStandards>" />
    <responsabilidade>
      - Validar o endpoint `GET /club`.
      - Testar cenários de busca com e sem filtros (nome, estado, cidade).
      - Validar a estrutura da paginação (`data`, `total`, `page`, `limit`).
    </responsabilidade>
    <naoDeve>
      - Depender de dados de outros arquivos de teste.
    </naoDeve>
    <criteriosAceitacao>
      - Deve retornar uma lista paginada de clubes.
      - Deve filtrar clubes corretamente por nome.
      - Deve retornar um array vazio quando nenhum clube corresponde ao filtro.
    </criteriosAceitacao>
  </tagDoTesteDeBuscaDeClubes>

  <tagDoTesteDeDetalhesDoClube state="NOVO">
    <path>test/club/get-club-info.e2e-spec.ts</path>
    <implements ref="<projectCodeStandards>" />
    <responsabilidade>
      - Validar o endpoint `GET /club/:id`.
      - Testar o cenário de sucesso, onde um clube existente é retornado.
      - Testar o cenário de falha, onde um clube não existente retorna 404.
    </responsabilidade>
    <criteriosAceitacao>
      - Deve retornar os dados completos de um clube específico.
      - Deve retornar `404 Not Found` para um ID de clube inválido.
      - Não deve retornar informações sensíveis.
    </criteriosAceitacao>
  </tagDoTesteDeDetalhesDoClube>
  
  <tagDaDocumentacaoDeTestes state="NOVO">
      <path>test/club/README.md</path>
      <responsabilidade>
          - Documentar a estrutura dos testes E2E para o módulo Club.
          - Explicar como utilizar o `setup.ts`.
          - Listar as rotas cobertas pelos testes.
      </responsabilidade>
  </tagDaDocumentacaoDeTestes>

  <migrationPlan>
    <step order="1">Criar o diretório `test/club`.</step>
    <step order="2">Implementar `test/club/setup.ts` com as funções de setup e cleanup.</step>
    <step order="3">Implementar `test/club/search-clubs.e2e-spec.ts`.</step>
    <step order="4">Implementar `test/club/get-club-info.e2e-spec.ts`.</step>
    <step order="5">Criar o arquivo `test/club/README.md` documentando a suíte.</step>
    <step order="6">Executar todos os testes para garantir que estão passando e são independentes.</step>
  </migrationPlan>

</clubTestSuite>

### **VERIFICAÇÃO FINAL DO ESTADO E CRITÉRIOS DE ACEITAÇÃO**

<finalState>
  O diretório `test/club/` deve existir.
</finalState>

<finalState>
  Os arquivos <clubTestSetup />, <searchClubsTest />, e <getClubInfoTest /> devem existir dentro de `test/club/`.
</finalState>

<finalState type="TestExecution">
  O comando `pnpm run test:e2e` deve executar as novas suítes de teste com sucesso.
</finalState>

<finalState type="TestCoverage">
  Os endpoints do <clubController> devem estar 100% cobertos por testes E2E.
</finalState>

<finalState type="CodeReview">
  - Aderência a <projectCodeStandards> verificada.
  - Uso correto do padrão de setup e cleanup cirúrgico.
</finalState>
</to-be>
