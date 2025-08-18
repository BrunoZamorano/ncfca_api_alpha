import { SearchUsers } from '@/application/use-cases/search-users/search-users';
import { UserQuery } from '@/application/queries/user-query/user-query.interface';
import SearchUsersQueryDto from '@/domain/dtos/search-users-query.dto';
import { PaginatedUserDto } from '@/domain/dtos/paginated-output.dto';
import { UserDto } from '@/domain/dtos/user.dto';
import { UserRoles } from '@/domain/enums/user-roles';

class MockUserQuery implements UserQuery {
  async search(query: SearchUsersQueryDto): Promise<PaginatedUserDto> {
    const mockUsers: UserDto[] = [
      {
        id: '1',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '1234567890',
        cpf: '12345678901',
        rg: '123456',
        roles: [UserRoles.SEM_FUNCAO],
        address: {
          street: 'Main St',
          number: '123',
          district: 'Downtown',
          city: 'São Paulo',
          state: 'SP',
          complement: '',
          zipCode: '01234567',
        },
      },
      {
        id: '2',
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '0987654321',
        cpf: '10987654321',
        rg: '654321',
        roles: [UserRoles.ADMIN],
        address: {
          street: 'Second St',
          number: '456',
          district: 'Uptown',
          city: 'Rio de Janeiro',
          state: 'RJ',
          complement: 'Apt 2',
          zipCode: '87654321',
        },
      },
    ];

    let filteredUsers = mockUsers;

    // Apply filters
    if (query.filter?.name) {
      filteredUsers = filteredUsers.filter((user) => `${user.firstName} ${user.lastName}`.toLowerCase().includes(query.filter!.name!.toLowerCase()));
    }

    if (query.filter?.email) {
      filteredUsers = filteredUsers.filter((user) => user.email.toLowerCase().includes(query.filter!.email!.toLowerCase()));
    }

    if (query.filter?.cpf) {
      filteredUsers = filteredUsers.filter((user) => user.cpf === query.filter!.cpf);
    }

    if (query.filter?.rg) {
      filteredUsers = filteredUsers.filter((user) => user.rg === query.filter!.rg);
    }

    if (query.filter?.role) {
      filteredUsers = filteredUsers.filter((user) => user.roles.includes(query.filter!.role!));
    }

    const page = query.pagination?.page || 1;
    const limit = query.pagination?.limit || 10;
    const total = filteredUsers.length;
    const totalPages = Math.ceil(total / limit);

    return {
      data: filteredUsers.slice((page - 1) * limit, page * limit),
      meta: {
        totalPages,
        total,
        limit,
        page,
      },
    };
  }
}

describe('Search Users', function () {
  let searchUsers: SearchUsers;
  let mockUserQuery: MockUserQuery;

  beforeEach(() => {
    mockUserQuery = new MockUserQuery();
    searchUsers = new SearchUsers(mockUserQuery);
  });

  it('Deve retornar todos os usuários quando não há filtros', async function () {
    const input: SearchUsersQueryDto = { pagination: { page: 1, limit: 10 } };
    const output = await searchUsers.execute(input);

    expect(output.data.length).toBe(2);
    expect(output.meta.total).toBe(2);
    expect(output.meta.totalPages).toBe(1);
    expect(output.meta.page).toBe(1);
    expect(output.meta.limit).toBe(10);
  });

  it('Deve filtrar usuários por nome', async function () {
    const input: SearchUsersQueryDto = {
      filter: { name: 'John' },
      pagination: { page: 1, limit: 10 },
    };
    const output = await searchUsers.execute(input);

    expect(output.data.length).toBe(1);
    expect(output.data[0].firstName).toBe('John');
    expect(output.meta.total).toBe(1);
  });

  it('Deve filtrar usuários por email', async function () {
    const input: SearchUsersQueryDto = {
      filter: { email: 'jane.smith' },
      pagination: { page: 1, limit: 10 },
    };
    const output = await searchUsers.execute(input);

    expect(output.data.length).toBe(1);
    expect(output.data[0].email).toBe('jane.smith@example.com');
    expect(output.meta.total).toBe(1);
  });

  it('Deve filtrar usuários por CPF', async function () {
    const input: SearchUsersQueryDto = {
      filter: { cpf: '12345678901' },
      pagination: { page: 1, limit: 10 },
    };
    const output = await searchUsers.execute(input);

    expect(output.data.length).toBe(1);
    expect(output.data[0].cpf).toBe('12345678901');
    expect(output.meta.total).toBe(1);
  });

  it('Deve filtrar usuários por RG', async function () {
    const input: SearchUsersQueryDto = {
      filter: { rg: '654321' },
      pagination: { page: 1, limit: 10 },
    };
    const output = await searchUsers.execute(input);

    expect(output.data.length).toBe(1);
    expect(output.data[0].rg).toBe('654321');
    expect(output.meta.total).toBe(1);
  });

  it('Deve filtrar usuários por role', async function () {
    const input: SearchUsersQueryDto = {
      filter: { role: UserRoles.ADMIN },
      pagination: { page: 1, limit: 10 },
    };
    const output = await searchUsers.execute(input);

    expect(output.data.length).toBe(1);
    expect(output.data[0].roles).toContain(UserRoles.ADMIN);
    expect(output.meta.total).toBe(1);
  });

  it('Deve retornar lista vazia quando não há correspondências', async function () {
    const input: SearchUsersQueryDto = {
      filter: { name: 'nonexistent' },
      pagination: { page: 1, limit: 10 },
    };
    const output = await searchUsers.execute(input);

    expect(output.data.length).toBe(0);
    expect(output.meta.total).toBe(0);
  });

  it('Deve respeitar paginação', async function () {
    const input: SearchUsersQueryDto = { pagination: { page: 1, limit: 1 } };
    const output = await searchUsers.execute(input);

    expect(output.data.length).toBe(1);
    expect(output.meta.totalPages).toBe(2);
    expect(output.meta.total).toBe(2);
    expect(output.meta.page).toBe(1);
    expect(output.meta.limit).toBe(1);
  });

  it('Deve combinar múltiplos filtros', async function () {
    const input: SearchUsersQueryDto = {
      filter: { name: 'Jane', role: UserRoles.ADMIN },
      pagination: { page: 1, limit: 10 },
    };
    const output = await searchUsers.execute(input);

    expect(output.data.length).toBe(1);
    expect(output.data[0].firstName).toBe('Jane');
    expect(output.data[0].roles).toContain(UserRoles.ADMIN);
    expect(output.meta.total).toBe(1);
  });
});
