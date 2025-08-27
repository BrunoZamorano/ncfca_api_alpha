# Padronização da Camada de API

## Visão Geral

Este documento descreve o padrão arquitetural adotado para integração com APIs no NFCFA Web, seguindo o fluxo: **Hook → Action → Gateway**. Esta padronização elimina acesso direto a tokens no cliente e centraliza toda comunicação de API através de Server Actions.

## Arquitetura

### Fluxo de Dados

```
Cliente (Hook) → Server Action → Gateway → API Externa
```

1. **Hooks**: Usam `useQuery`/`useMutation` do TanStack Query para chamar Server Actions
2. **Actions**: Server-side functions com `'use server'` que fazem autenticação e delegam para Gateways
3. **Gateways**: Abstrações que encapsulam chamadas HTTP para APIs externas

### Responsabilidades

- **Hooks**: Gerenciamento de estado do cliente, cache e UI
- **Actions**: Autenticação, autorização e coordenação
- **Gateways**: Implementação de protocolos HTTP e mapeamento de DTOs

## Exemplos

### Hook Padrão

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { QueryKeys } from '@/infraestructure/cache/query-keys';
import { getClubMembersAction } from '@/infraestructure/actions/admin/get-club-members.action';

export function useAdminClubMembers(clubId: string) {
  return useQuery({
    queryKey: QueryKeys.admin.clubMembers(clubId),
    queryFn: () => getClubMembersAction(clubId),
    enabled: !!clubId,
  });
}
```

### Server Action Padrão

```typescript
'use server';

import { auth } from "@/infraestructure/auth";
import { Inject } from "@/infraestructure/containers/container";
import { UserRoles } from "@/domain/enums/user.roles";

export async function getClubMembersAction(clubId: string) {
  const session = await auth();
  if (!session?.accessToken || !session.user.roles.includes(UserRoles.ADMIN)) {
    throw new Error('Acesso negado.');
  }

  const adminGateway = Inject.AdminGateway(session.accessToken);
  return adminGateway.getClubMembers(clubId);
}
```

### Gateway Interface

```typescript
export interface AdminGateway {
  /**
   * Retorna uma lista paginada de todos os membros ativos de um clube
   * OpenAPI: GET /admin/clubs/{clubId}/members
   */
  getClubMembers(clubId: string): Promise<ClubMemberDto[]>;
}
```

## Cache e Invalidação

### QueryKeys
Use `QueryKeys` centralizadas para consistência:

```typescript
import { QueryKeys } from '@/infraestructure/cache/query-keys';

// Query
queryKey: QueryKeys.admin.clubMembers(clubId)

// Invalidação em mutação
queryClient.invalidateQueries({ queryKey: QueryKeys.admin.clubMembers(clubId) });
```

### NextKeys
Para revalidação de cache do Next.js:

```typescript
import { revalidateTag } from "next/cache";
import { NextKeys } from "@/infraestructure/cache/next-keys";

// Em Actions de mutação
revalidateTag(NextKeys.admin.clubMembers(clubId));
```

## Regras de Segurança

### ❌ Proibido em Hooks
- `useSession()` - tokens devem ficar no servidor
- `fetch()` direto - use Actions
- `process.env.NEXT_PUBLIC_BACKEND_URL` - deixe para Gateways

### ✅ Permitido em Hooks
- `useQuery`/`useMutation` chamando Actions
- `QueryKeys` para cache
- Lógica de transformação de dados para UI

## Estrutura de Arquivos

```
src/
├── hooks/                          # Client-side hooks
│   └── use-admin-*.ts              # TanStack Query hooks
├── infraestructure/
│   ├── actions/admin/              # Server Actions
│   │   ├── get-*.action.ts         # Queries
│   │   └── *-enrollment.action.ts  # Mutations
│   ├── gateways/                   # Gateway implementations
│   │   └── *.gateway.api.ts
│   └── cache/
│       ├── query-keys.ts           # TanStack Query keys
│       └── next-keys.ts            # Next.js cache tags
├── application/gateways/           # Gateway interfaces
└── contracts/api/                  # DTOs
```

## Checklist de Desenvolvimento

### Novos Hooks
- [ ] Usa apenas Actions, nunca `fetch()` direto
- [ ] Não usa `useSession()` 
- [ ] Usa `QueryKeys` oficiais
- [ ] Mutações invalidam chaves relacionadas

### Novas Actions
- [ ] Marca `'use server'`
- [ ] Faz `auth()` e verifica roles quando necessário
- [ ] Usa `Inject.{Gateway}(token)`
- [ ] Revalida cache com `NextKeys` apropriadas

### Novos Gateways
- [ ] Interface documentada com rota OpenAPI
- [ ] Implementação usa DTOs tipados
- [ ] Tratamento de erro propaga mensagens do body

### Pull Requests
- [ ] Mapeamento de contratos do `openapi.json` documentado
- [ ] Verificado ausência de `fetch`/`useSession` em hooks
- [ ] Invalidações `QueryKeys`/`NextKeys` testadas
- [ ] Build e lint passando

## Comandos de Verificação

```bash
# Verificar fetch/useSession em hooks
rg -n "fetch\(|useSession" src/hooks/

# Verificar queries legacy
rg -n "src/infraestructure/queries/|src/infraestructure/services/query.service.api"
```