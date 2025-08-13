import { Inject, Injectable } from '@nestjs/common';

import { UserQuery } from '@/application/queries/user-query/user-query.interface';
import SearchUsersQueryDto from '@/domain/dtos/search-users-query.dto';
import { PaginatedUserDto } from '@/domain/dtos/paginated-output.dto';
import { UserDto } from '@/domain/dtos/user.dto';
import { PrismaService } from '@/infraestructure/database/prisma.service';
import { UserRoles } from '@/domain/enums/user-roles';
import { AddressDto } from '@/domain/dtos/address.dto';

interface UserQueryResult {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  cpf: string;
  rg: string;
  roles: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string | null;
  zip_code: string;
}

@Injectable()
export class UserQueryPrisma implements UserQuery {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async search(query: SearchUsersQueryDto): Promise<PaginatedUserDto> {
    const { filter, pagination } = query;
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions: string[] = [];
    const params: any[] = [];

    if (filter?.name) {
      conditions.push(`(LOWER(first_name || ' ' || last_name) LIKE LOWER($${params.length + 1}))`);
      params.push(`%${filter.name}%`);
    }

    if (filter?.email) {
      conditions.push(`LOWER(email) LIKE LOWER($${params.length + 1})`);
      params.push(`%${filter.email}%`);
    }

    if (filter?.cpf) {
      conditions.push(`cpf = $${params.length + 1}`);
      params.push(filter.cpf);
    }

    if (filter?.rg) {
      conditions.push(`rg = $${params.length + 1}`);
      params.push(filter.rg);
    }

    if (filter?.role) {
      conditions.push(`(roles = $${params.length + 1} OR roles LIKE $${params.length + 2} OR roles LIKE $${params.length + 3} OR roles LIKE $${params.length + 4})`);
      params.push(
        filter.role, // exact match
        `${filter.role},%`, // role at beginning
        `%,${filter.role},%`, // role in middle
        `%,${filter.role}` // role at end
      );
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `
      SELECT COUNT(*) as count
      FROM "User"
      ${whereClause}
    `;

    // Data query
    const dataQuery = `
      SELECT 
        id, email, first_name, last_name, phone, cpf, rg, roles,
        street, number, neighborhood, city, state, complement, zip_code
      FROM "User"
      ${whereClause}
      ORDER BY first_name ASC, last_name ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);

    const [countResult, users] = await Promise.all([
      this.prisma.$queryRawUnsafe<{ count: bigint }[]>(countQuery, ...params.slice(0, -2)),
      this.prisma.$queryRawUnsafe<UserQueryResult[]>(dataQuery, ...params),
    ]);

    const total = Number(countResult[0].count);
    const totalPages = Math.ceil(total / limit);

    const userDtos: UserDto[] = users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      cpf: user.cpf,
      rg: user.rg,
      roles: user.roles ? (user.roles.split(',') as UserRoles[]) : [UserRoles.SEM_FUNCAO],
      address: {
        street: user.street,
        number: user.number,
        district: user.neighborhood,
        city: user.city,
        state: user.state,
        complement: user.complement,
        zipCode: user.zip_code,
      } as AddressDto,
    }));

    return {
      data: userDtos,
      meta: {
        totalPages,
        total,
        limit,
        page,
      },
    };
  }
}
