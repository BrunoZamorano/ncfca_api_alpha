# TEMPLATE DE ESPECIFICAÇÃO DE REFATORAÇÃO DECLARATIVA
# VERSÃO: FRAMEWORK v3.0 (modo TAG-PRIMEIRO)
# DATA: 20 de agosto de 2025
#
# FILOSOFIA (TAG > name):
# Preferimos <TagEspecífica> em vez de <tipo name="tag-específica">.
#   - DTOs e contratos podem manter <property name=".." type=".."> (faz sentido técnico).
#   - Para o restante, a PRÓPRIA TAG É O ID. Referencie a tag pelo nome.
# Benefício: semântica forte, rastreabilidade e refactors simples (busca por tag).

### COMO USAR ESTE FRAMEWORK ###
#
# 1) LINGUAGEM UBÍQUA EM <reference> (TAG POR ARQUIVO):
#    - Sempre crie uma tag específica por arquivo/componente. Ex.: <authUseCaseLegacy>, <loginScreenConsumer>.
#    - Evite atributos "name" para identificar entidades; use o nome da TAG como identidade.
#
# 2) AGRUPAMENTO & REFERENCIAÇÃO:
#    - Agrupe arquivos em contêineres semânticos usando tags específicas (ex.: <authLegacyGroup>).
#    - Referencie SEMPRE por tag. Ex.: desiredContractRef="<AutenticacaoGateway>".
#
# 3) DIAGNÓSTICO (<as-is>) COM FATOS:
#    - Descreva acoplamentos, duplicações, inconsistências de contrato e métricas, citando tags.
#
# 4) ESTADO FUTURO (<to-be>):
#    - Declare portas/adapters, DTOs e fluxos. Transforme por TAG com state="NOVO|MODIFICADO|DELETADO".
#
# 5) PRONTO (<finalState>):
#    - Critérios automatizáveis (testes, revisão, performance). Tudo verificável por script.
#
# NOTA PÉTREA:
#    - <projectCodeStandards> é imutável. Demais tags podem variar conforme a spec.
#

<task>
[Descreva aqui o objetivo principal da refatoração em uma frase.]
</task>

__________________________________________________________________________________________

<reference>

  <!-- Conceitos e Padrões do Documento -->
  <concepts_and_patterns>
    <!-- PÉTREA -->
    <projectCodeStandards>[caminho/para/documento_de_regras_de_projeto.md]</projectCodeStandards>

    <conceptApiContract>[caminho/para/swagger.json ou openapi.json]</conceptApiContract>
    <patternOld>[Nome do Padrão Antigo, ex: Active Record, Service Legado]</patternOld>
    <patternNew>[Nome do Padrão Novo, ex: Gateway, Repository, Ports&Adapters]</patternNew>
    <folderToDelete>[caminho/para/pasta_obsoleta/]</folderToDelete>
  </concepts_and_patterns>

  <!-- AGRUPAMENTO: use tags como IDs -->
  <filesToDelete>
    <authLegacyGroup purpose="remover legado de autenticação">
      <authUseCaseLegacy path="src/app/usecases/auth/login.ts" role="usecase" />
      <authServiceLegacy path="src/app/services/authService.ts" role="service" />
      <authMapperLegacy path="src/app/mappers/authMapper.ts" role="mapper" />
    </authLegacyGroup>
    <!-- Crie quantos grupos precisar. Cada arquivo TEM sua própria tag. -->
  </filesToDelete>

  <!-- INTERFACES A MODIFICAR: tag é a identidade -->
  <interfacesToModify>
    <authGatewayInterface path="src/domain/gateways/AutenticacaoGateway.ts"
                          desiredContractRef="<AutenticacaoGateway>"
                          rationale="unificar porta de autenticação conforme <patternNew>" />
    <userRepositoryInterface path="src/domain/repositories/UserRepository.ts"
                             desiredContractRef="<UserRepository>"
                             rationale="isolar persistência e suportar testes" />
  </interfacesToModify>

  <!-- REFERÊNCIAS CRUZADAS -->
  <refs>
    <dependsOf src="<loginScreenConsumer>" on="<authUseCaseLegacy>" reason="acoplamento direto ao legado" />
    <willDependOf src="<loginScreenConsumer>" on="<authGatewayInterface>" when="pós-refatoração" />
  </refs>

</reference>

__________________________________________________________________________________________

<as-is>
  <!-- Enriquecido com fatos e métricas; cite SEMPRE tags específicas -->

  <contextoArquitetural>
    - <loginScreenConsumer> importa diretamente <authUseCaseLegacy>.
    - <authUseCaseLegacy> mistura validação, HTTP e mapeamento de DTOs.
    - Não existe porta explícita; contrato implícito de cliente HTTP.
  </contextoArquitetural>

  <evidencias>
    <acoplamento>
      - <loginScreenConsumer> → import de <authUseCaseLegacy> (linha 42).
      - axios/fetch usado DENTRO de <authUseCaseLegacy> (quebra DIP/Ports&Adapters).
    </acoplamento>

    <duplicacao>
      - <authServiceLegacy> e <authUseCaseLegacy> duplicam payload { email, password }.
      - Tratamento de erro HTTP duplicado em <authMapperLegacy> e no componente.
    </duplicacao>

    <inconsistenciaDeContrato>
      - <conceptApiContract> diz: POST /auth/login → { userId, token, expiresIn }.
      - Implementação real retorna { id, jwt, ttl } → mapeamentos ad-hoc espalhados.
    </inconsistenciaDeContrato>

    <metricas>
      - CC de <authUseCaseLegacy>: 18 (alvo ≤ 10).
      - Cobertura módulo auth: 41% (alvo ≥ 90%).
      - Login staging: 320ms p50 / 780ms p95.
    </metricas>
  </evidencias>

  <consequencias>
    - Testes frágeis: mocks precisam conhecer axios/fetch.
    - Migrações de SDK/HTTP custosas.
    - Evoluir contrato de <conceptApiContract> exige alterações difusas.
  </consequencias>
</as-is>

__________________________________________________________________________________________

<to-be>
### **DECLARAÇÃO DO ESTADO FUTURO DO CÓDIGO**
<!-- Estado alvo aderente a <patternNew>, com portas explícitas e contratos versionados. -->

<exemploDeModulo>

  <designPatterns>
    <Gateway />
    <DependencyInjection />
    <PortsAndAdapters />
  </designPatterns>

  <!-- CONTRATOS E DTOs: aqui faz sentido manter propriedades como name/type -->
  <dataContracts>
    <CredenciaisDTO>
      <property name="email" type="string" />
      <property name="password" type="string" />
    </CredenciaisDTO>

    <SessaoUsuarioDTO>
      <property name="userId" type="string" />
      <property name="token" type="string" />
      <property name="expiresIn" type="number" />
    </SessaoUsuarioDTO>

    <!-- Interface como TAG (id pela tag). Métodos podem ser tags também. -->
    <AutenticacaoGateway>
      <login signature="(credentials: CredenciaisDTO) => Promise<SessaoUsuarioDTO>" />
    </AutenticacaoGateway>
  </dataContracts>

  <!-- Transformações por TAG -->
  <tagDoUseCaseDeAutenticacao state="DELETADO">
    <justificativa>
      Centralizamos rede/regras: contrato em <AutenticacaoGateway>, implementação em Adapter HTTP.
    </justificativa>
    <impactos>
      - Remover imports em <loginScreenConsumer>.
      - Atualizar testes para mockar <AutenticacaoGateway>.
    </impactos>
    <rollback>
      - Guardar commit hash do último estado funcional.
      - Feature flag: auth_port_toggle.
    </rollback>
  </tagDoUseCaseDeAutenticacao>

  <tagDaInterfaceDoGatewayDeAutenticacao state="MODIFICADO">
    <responsabilidade>
      Porta única de autenticação, alinhada a <conceptApiContract>.
    </responsabilidade>
    <contrato>
      Deve exportar e se conformar com <AutenticacaoGateway> em <dataContracts>.
    </contrato>
    <naoDeve>
      Não conter detalhes de HTTP (axios/fetch).
    </naoDeve>
    <criteriosAceitacao>
      - Tipos públicos sem dependências de libs HTTP.
      - Assinatura de <login> idêntica à de <AutenticacaoGateway>.
    </criteriosAceitacao>
  </tagDaInterfaceDoGatewayDeAutenticacao>

  <tagDoConsumidorDaTelaDeLogin state="MODIFICADO">
    <transformacao>
      Componente “dumb”: renderiza UI e delega ações via Hook/Controller.
    </transformacao>
    <desacoplamento>
      - Remover import de <authUseCaseLegacy>.
      - Passar a depender de useAuth() que injeta <authGatewayInterface>.
    </desacoplamento>
    <criteriosAceitacao>
      - Storybook funciona com mock de <AutenticacaoGateway> (sem rede).
      - Teste de integração cobre “feliz” e “credencial inválida”.
    </criteriosAceitacao>
  </tagDoConsumidorDaTelaDeLogin>

  <tagDoAdapterHttpDeAutenticacao state="NOVO">
    <path>src/infra/http/AuthGatewayHttp.ts</path>
    <implements ref="<authGatewayInterface>" />
    <mapeamentos>
      - request: <CredenciaisDTO> → body de <conceptApiContract> (/auth/login).
      - response: { id, jwt, ttl } → <SessaoUsuarioDTO>.
    </mapeamentos>
    <observabilidade>
      - métrica: auth_login_latency_ms (p50/p95).
      - log: falhas 4xx/5xx com correlationId.
    </observabilidade>
  </tagDoAdapterHttpDeAutenticacao>

  <migrationPlan>
    <step order="1">Criar <authGatewayInterface> e testes de contrato.</step>
    <step order="2">Implementar <tagDoAdapterHttpDeAutenticacao>.</step>
    <step order="3">Refatorar <loginScreenConsumer> para usar Hook/Controller.</step>
    <step order="4">Remover <authLegacyGroup>.</step>
    <step order="5">Ativar flag e monitorar métricas por 48h.</step>
  </migrationPlan>

  <riscosERollback>
    - Risco: divergência com <conceptApiContract>. Mitigar com contract tests.
    - Risco: regressão de latência. Mitigar com baseline e alertas p95.
  </riscosERollback>

</exemploDeModulo>

### EXPRESSE-SE (DECLARATIVIDADE)
<!-- Crie novas tags conforme a necessidade: <security>, <observabilidade>, <i18n>, <a11y>, <nonGoals>, etc.
     O importante é que cada tag seja objetiva, verificável e referenciável por nome. -->

### **VERIFICAÇÃO FINAL DO ESTADO E CRITÉRIOS DE ACEITAÇÃO**

<finalState>
  A pasta de <folderToDelete> não deve existir.
  # Script: test -d <folderToDelete> && exit 1 || exit 0
</finalState>

<finalState>
  Nenhum arquivo deve importar/usar qualquer tag listada em <filesToDelete>.
  # Script: grep recursivo por cada path declarado nas tags.
</finalState>

<finalState type="TestCoverage">
  Cobertura ≥ 95% para implementações novas/alteradas.
</finalState>

<finalState type="IntegrationTests">
  Fluxos “feliz” e “erro” do login com mock de <AutenticacaoGateway>.
</finalState>

<finalState type="ContractTests">
  Resposta de /auth/login válida contra <conceptApiContract>.
</finalState>

<finalState type="CodeReview">
  ≥ 2 aprovações sênior verificando:
  - aderência a <projectCodeStandards> (pétrea),
  - remoção do legado,
  - consistência da linguagem ubíqua (tags coerentes).
</finalState>

<finalState type="PerformanceBenchmark">
  p95 de login em staging não regrede > 5% vs baseline.
</finalState>

<finalState type="StaticChecks">
  Lint/Typecheck OK; zero import cycles.
</finalState>

</to-be>
