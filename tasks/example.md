<task>
    Refactor Change Principal Functionality
</task>

<taskspec>
This task involves refactoring the existing "Change Principal" feature to align with the project's established architectural standards, making it more maintainable, scalable, and testable. The current implementation will be updated to use a new, dedicated React Query hook (`useChangePrincipal`) for the mutation, and the user search mechanism will be improved.

- **Refactor Dialog**: The existing dialog at `@/src/app/(admin)/admin/dashboard/clubs/_components/change-principal-dialog.tsx` will be refactored. Instead of receiving static user lists and callback handlers, it will encapsulate its own logic by using the new hooks.
- **Create `useChangePrincipal` Hook**: A new hook will be created to handle the logic for changing a club's principal. This is the primary prerequisite.
- **Create `useSearchUsers` Hook**: To improve performance and standards, a new hook for searching users will be created and used within the dialog, replacing the static `users` prop.
  </taskspec>

# Prerequisite Task: Create `useChangePrincipal` Hook

This is a foundational task to create the data flow for the feature, following the standard set by `use-my-club.ts`.

<details>
<summary><strong>Architectural Implementation Plan</strong></summary>

1.  **DTO (`contracts`)**:
    *   Verify or create a DTO for the request payload in `src/contracts/api/admin.dto.ts`.
    *   **File**: `src/contracts/api/admin.dto.ts`
    *   **Content**:
        ```typescript
        export interface ChangePrincipalDto {
          newPrincipalId: string;
        }
        ```

2.  **Gateway (`application` & `infraestructure`)**:
    *   **Interface**: Define the contract in `src/application/gateways/admin.gateway.ts`.
    *   **Implementation**: Implement the fetch logic in `src/infraestructure/gateways/admin.gateway.api.ts`.

3.  **Action (`infraestructure/actions`)**:
    *   Create a new server action to orchestrate the call.
    *   **File**: `src/infraestructure/actions/admin/change-club-principal.action.ts`
    *   **Content**:
        ```typescript
        'use server';
        import { auth } from '@/infraestructure/auth';
        import { adminGateway } from '@/infraestructure/containers/gateways.container';
        import { revalidateTag } from 'next/cache';
        import { QueryKeys } from '@/infraestructure/cache/query-keys';

        export async function changeClubPrincipalAction(clubId: string, newPrincipalId: string) {
          const session = await auth();
          if (!session?.accessToken) throw new Error('Unauthorized');
          
          await adminGateway.changeClubPrincipal(clubId, { newPrincipalId }, session.accessToken);

          revalidateTag(QueryKeys.admin.clubs());
          revalidateTag(QueryKeys.admin.clubById(clubId));
        }
        ```

4.  **Hook (`hooks`)**:
    *   Create the final, UI-facing hook.
    *   **File**: `src/hooks/use-change-principal.ts`
    *   **Content**:
        ```typescript
        'use client';
        import { useMutation, useQueryClient } from '@tanstack/react-query';
        import { useNotify } from './use-notify';
        import { changeClubPrincipalAction } from '@/infraestructure/actions/admin/change-club-principal.action';
        import { QueryKeys } from '@/infraestructure/cache/query-keys';

        export function useChangePrincipal() {
          const notify = useNotify();
          const queryClient = useQueryClient();

          return useMutation({
            mutationFn: ({ clubId, newPrincipalId }: { clubId: string, newPrincipalId: string }) => 
              changeClubPrincipalAction(clubId, newPrincipalId),
            onSuccess: () => {
              notify.success('Principal changed successfully.');
              queryClient.invalidateQueries({ queryKey: QueryKeys.admin.clubs() });
            },
            onError: (error) => notify.error(error.message),
          });
        }
        ```
</details>

# Main Task: Refactor `ChangePrincipalDialog`

<taskspec>
The component at `@/src/app/(admin)/admin/dashboard/clubs/_components/change-principal-dialog.tsx` will be refactored to be self-contained and adhere to project standards.

1.  **Hook Integration**:
    *   The dialog will use the newly created `useChangePrincipal` hook to handle the mutation.
    *   The `isPending` state from the hook will control the form's disabled state and show loaders.
    *   `onSuccess` and `onError` from the hook will automatically handle notifications.

2.  **Dynamic User Search**:
    *   The dialog will use a new (to be created) `useSearchUsers` hook to dynamically fetch users as the admin types in the Combobox. This removes the need to pass a static `users` prop.
    *   The `useSearchUsers` hook should be implemented following the same architecture as `useChangePrincipal`.

3.  **Component Signature**:
    *   **Before**: `ChangePrincipalDialog({ isOpen, club, users, isPending, onClose, onSubmit })`
    *   **After**: `ChangePrincipalDialog({ isOpen, club, onClose })`
        </taskspec>

# instructions

- **Follow the Architecture**: Strictly adhere to the `hook -> action -> gateway` pattern for all data-fetching and mutation logic.
- **No New Files (for Dialog)**: The dialog refactoring must occur within the existing file. The new hooks and actions will require new files as specified.
- **Component Library**: Continue to use **ShadCN** for all UI components.

# Critical

- **Endpoint Correction**: The endpoint seems to be `/principal`, not `/director`. The implementation must use the correct endpoint.
- **Data Revalidation**: The `changeClubPrincipalAction` must revalidate relevant query keys (`admin-clubs`, `admin-club-by-id`) to ensure the UI updates automatically across the application.
- **Error Handling**: Ensure robust error handling at every layer (gateway, action, hook).
- **DO NOT FORGET TO REGISTER THE GATEWAY IF ITS NOT**src/infraestructure/containers/container.ts
