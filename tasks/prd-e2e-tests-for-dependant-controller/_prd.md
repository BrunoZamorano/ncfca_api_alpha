# Product Requirements Document (PRD): Testes End-to-End para DependantController

## Overview

Este documento descreve os requisitos para a criação de uma suíte de testes End-to-End (E2E) para o `DependantController`. O objetivo é garantir que todas as funcionalidades relacionadas à gestão de dependentes e famílias estejam funcionando conforme o esperado, desde a requisição HTTP até a resposta, passando por todas as camadas da aplicação. A suíte de testes seguirá os padrões e a estrutura já estabelecidos no módulo `club-management`, garantindo consistência e manutenibilidade.

## Goals

- **Garantir a Qualidade:** Assegurar que o `DependantController` e seus casos de uso associados funcionem corretamente em um ambiente que simula a produção.
- **Prevenir Regressões:** Criar uma rede de segurança automatizada para detectar quebras de funcionalidade introduzidas por futuras alterações no código.
- **Padronização:** Manter a consistência com as práticas de teste E2E existentes no projeto, facilitando a manutenção e a compreensão dos testes.
- **Cobertura Completa:** Testar todos os endpoints do `DependantController`, incluindo cenários de sucesso, erro e validação de permissões.

## User Stories

- **Como desenvolvedor,** eu quero uma suíte de testes E2E para o `DependantController`, para que eu possa validar o comportamento de ponta a ponta e garantir que novas alterações não quebrem a funcionalidade existente.
- **Como QA,** eu quero testes automatizados que cubram os fluxos de adição, visualização, atualização e remoção de dependentes, para garantir a estabilidade do sistema.

## Core Features

A suíte de testes deverá cobrir os seguintes endpoints do `DependantController`:

1.  **Adicionar Dependente:**
    -   `POST /dependants`
    -   **Requisitos Funcionais:**
        -   (R1.1) Deve ser possível para um usuário autenticado adicionar um novo dependente à sua família.
        -   (R1.2) Não deve ser possível adicionar um dependente com dados inválidos (ex: CPF inválido, data de nascimento futura).
        -   (R1.3) A resposta deve conter os dados do dependente recém-criado.

2.  **Visualizar Família:**
    -   `GET /dependants/my-family`
    -   **Requisitos Funcionais:**
        -   (R2.1) Deve retornar os dados da família do usuário autenticado, incluindo o titular e todos os seus dependentes.

3.  **Visualizar Dependente Específico:**
    -   `GET /dependants/:id`
    -   **Requisitos Funcionais:**
        -   (R3.1) Deve retornar os dados de um dependente específico que pertença à família do usuário.
        -   (R3.2) Deve retornar um erro 404 se o dependente não for encontrado.
        -   (R3.3) Deve retornar um erro de autorização (403) se o usuário tentar visualizar um dependente de outra família.

4.  **Listar Dependentes:**
    -   `GET /dependants`
    -   **Requisitos Funcionais:**
        -   (R4.1) Deve listar todos os dependentes associados à família do usuário autenticado.
        -   (R4.2) Deve retornar uma lista vazia se o usuário não tiver dependentes.

5.  **Atualizar Dependente:**
    -   `PATCH /dependants/:id`
    -   **Requisitos Funcionais:**
        -   (R5.1) Deve ser possível atualizar os dados de um dependente existente.
        -   (R5.2) Não deve ser possível atualizar um dependente com dados inválidos.
        -   (R5.3) Deve retornar um erro 404 se o dependente a ser atualizado não for encontrado.
        -   (R5.4) Deve retornar um erro de autorização (403) se o usuário tentar atualizar um dependente de outra família.

6.  **Remover Dependente:**
    -   `DELETE /dependants/:id`
    -   **Requisitos Funcionais:**
        -   (R6.1) Deve ser possível remover um dependente da família.
        -   (R6.2) Deve retornar um erro 404 se o dependente a ser removido não for encontrado.
        -   (R6.3) Deve retornar um erro de autorização (403) se o usuário tentar remover um dependente de outra família.

## User Experience

-   Não aplicável (testes de API).

## High-Level Technical Constraints

-   Os testes devem ser escritos em TypeScript, utilizando o framework Jest.
-   As requisições HTTP devem ser feitas utilizando a biblioteca `supertest`.
-   A suíte de testes deve incluir um arquivo `setup.ts` para encapsular a lógica de inicialização da aplicação, criação de usuários de teste e limpeza de dados, seguindo o padrão de `test/club-management/setup.ts`.
-   A limpeza de dados (`cleanup`) deve ser "cirúrgica", removendo apenas os dados criados durante os testes para garantir a independência e a não-interferência com outras suítes.

## Non-Goals (Out of Scope)

-   Testes de unidade para os casos de uso individuais (estes devem ser feitos separadamente).
-   Testes de performance ou carga da API.
-   Testes da interface do usuário (frontend).

## Phased Rollout Plan

-   **MVP:** Implementar a estrutura de setup (`setup.ts`) e os testes E2E para os cenários de sucesso (caminho feliz) de todas as rotas do `DependantController`.
-   **Phase 2:** Implementar os testes para cenários de erro, como validação de dados de entrada e tratamento de exceções (ex: CPF inválido, dependente não encontrado).
-   **Phase 3:** Implementar os testes para cenários de autorização, garantindo que um usuário não possa acessar ou modificar os dependentes de outra família.

## Success Metrics

-   **Cobertura de Código:** A suíte de testes E2E deve aumentar a cobertura de código para o `DependantController` e seus casos de uso relacionados.
-   **Taxa de Sucesso dos Testes:** 100% dos testes devem passar no pipeline de CI/CD.
-   **Detecção de Bugs:** A suíte deve ser capaz de identificar regressões antes que o código seja mesclado à branch principal.

## Risks and Mitigations

-   **Risco:** A complexidade na configuração do estado inicial do banco de dados para cada teste.
    -   **Mitigação:** Criar funções utilitárias robustas no arquivo `setup.ts` para abstrair a criação de usuários, famílias e dependentes, tornando os testes mais legíveis e fáceis de escrever.
-   **Risco:** Testes lentos que impactam o tempo de execução do pipeline de CI/CD.
    -   **Mitigação:** Otimizar a inicialização da aplicação e as operações de banco de dados. Garantir que a limpeza de dados seja eficiente.

## Open Questions

-   Nenhuma no momento.

## Appendix

-   **Referência Principal:** `test/club-management/README.md` e `test/club-management/setup.ts`
-   **Controller Alvo:** `src/infraestructure/controllers/dependant/dependant.controller.ts`
