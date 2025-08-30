- status: complete

<task> 
- fix the supertest's return types that are logging erros on npx eslint <target-test-folder>
</task>

<target-test-folder>./test/club/</target-test-folder>

<the-solving-plan>
**FOR EACH TEST FILE ON <target-test-folder>**
    1. Find supertest calls in <target-test-file>
    2. Identify the route being called
    3. Find the corresponding controller for that route
    - controller's folder: @./src/infrastructure/controllers/*.controller.ts
    4. Find the DTO used for that route's response
    - dto's folder: @./src/infrastructure/dtos/*.dto.ts
    5. Type the supertest response with that DTO
    6. run npx eslint ./<target-test-file>
    7. run pnpm test:e2e

</the-solving-plan>

<critical>
- **YOURE JUST ALOWED TO FIX THE <target-test-file>
- **DON'T CHANGE THE TEST'S ALGORITHM**
- **JUST REFACTOR IT
- **FOLLOW STRICTLY THE PROJECT'S RULES: ./cursor/rules/*.mdc`
</critical>