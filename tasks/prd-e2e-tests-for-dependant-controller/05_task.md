---
status: completed
---

<task_context>
<domain>test/e2e</domain>
<type>testing</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database, test/infra</dependencies>
</task_context>

# Tarefa 5.0: Implementar Testes E2E para Remoção de Dependentes

## Overview

Esta tarefa finaliza a suíte de testes validando o endpoint de exclusão, `DELETE /dependants/:id`. Os testes devem confirmar que um dependente pode ser removido com sucesso e que as verificações de segurança apropriadas estão em vigor.

<import>**MUST READ BEFORE STARTING** @tasks/prd-e2e-tests-for-dependant-controller/_prd.md</import>

<requirements>
- Os testes devem ser adicionados ao arquivo `test/dependant/dependant.e2e-spec.ts`.
- Utilizar as funções do `setup.ts` para preparar o ambiente de cada teste.
- Cobrir cenários de sucesso, não encontrado e autorização.
</requirements>

## Subtasks

- [x] 5.1 Escrever teste para `DELETE /dependants/:id`: deve remover um dependente com sucesso (status 204).
- [x] 5.2 Escrever teste para `DELETE /dependants/:id`: deve retornar erro 404 se o dependente não existir.
- [x] 5.3 Escrever teste para `DELETE /dependants/:id`: deve retornar erro 404 se o dependente pertencer a outra família. *Nota: Implementação retorna 404 ao invés de 403, o que é melhor para segurança pois não revela informações sobre dependentes de outras famílias.*
- [x] 5.4 Após a remoção, verificar se o dependente não é mais retornado na listagem (`GET /dependants`).

## Implementation Details

O teste 5.4 é importante para garantir que a exclusão teve o efeito esperado no estado do sistema.

### Arquivos Relevantes

- `test/dependant/dependant.e2e-spec.ts`

### Dependent Files

- `test/dependant/setup.ts`

## Success Criteria

- Todos os testes para o endpoint `DELETE /dependants/:id` são implementados e passam com sucesso.
- Os cenários de sucesso, não encontrado e de falha de autorização são cobertos.
- A remoção é verificada através de uma chamada de listagem subsequente.
