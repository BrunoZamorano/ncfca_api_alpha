import {
  PrismaClient,
  UserRole,
  FamilyStatus,
  DependantRelationship,
  Sex,
  MembershipStatus,
  EnrollmentStatus,
} from '@prisma/client';
import { faker } from '@faker-js/faker';
import { CpfGenerator } from '@/infraestructure/services/cpf-generator.service';
import Dependant from '@/domain/entities/dependant/dependant';
import DependantMapper from '@/shared/mappers/dependant.mapper';
import { HashingServiceBcrypt } from '@/infraestructure/services/hashing-bcrypct.service';
import { UserRoles } from '@/domain/enums/user-roles';
import User, { CreateUserProps } from '@/domain/entities/user/user';
import UuidGenerator from '@/infraestructure/services/uuid-generator';
import UserMapper from '@/shared/mappers/user.mapper';
import { DependantType } from '@/domain/enums/dependant-type.enum';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o processo de seed...');

  console.log('Limpando o banco de dados...');
  await prisma.$transaction([
    prisma.clubMembership.deleteMany(),
    prisma.enrollmentRequest.deleteMany(),
    prisma.dependant.deleteMany(),
    prisma.club.deleteMany(),
    prisma.family.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  console.log('Banco de dados limpo.');
  const cpfGenerator = new CpfGenerator();

  const hashinService = new HashingServiceBcrypt();
  const idGenerator = new UuidGenerator();

  console.log('Criando 10 usuários, famílias, clubes e dependentes...');

  for (let i = 0; i < 10; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    await prisma.$transaction(async (tx) => {
      const userProps: CreateUserProps = {
        firstName,
        lastName,
        password: User.DEFAULT_PASSWORD,
        email: faker.internet.email({ firstName, lastName }),
        roles: [UserRoles.DONO_DE_CLUBE, UserRoles.SEM_FUNCAO],
        phone: faker.phone.number(),
        cpf: cpfGenerator.gerarCpf(),
        rg: faker.string.numeric(9),
        address: {
          district: faker.location.secondaryAddress(),
          zipCode: faker.location.zipCode('#####-###'),
          street: faker.location.streetAddress(),
          number: faker.location.buildingNumber(),
          state: faker.location.state({ abbreviated: true }),
          city: faker.location.city(),
        },
      };
      const user = User.create(userProps, idGenerator, hashinService);
      const createdUser = await tx.user.create({
        data: UserMapper.toPersistence(user),
      });

      const family = await tx.family.create({
        data: {
          holder_id: createdUser.id,
          status: FamilyStatus.AFFILIATED,
          affiliated_at: new Date(),
          affiliation_expires_at: faker.date.future({ years: 1 }),
        },
      });

      const club = await tx.club.create({
        data: {
          principal_id: createdUser.id,
          name: `${faker.company.name()} Clube`,
          city: createdUser.city,
          state: createdUser.state,
          zip_code: createdUser.zip_code,
          street: createdUser.street,
          number: createdUser.number,
          neighborhood: createdUser.neighborhood,
        },
      });

      const dependants: Dependant[] = [];
      for (let j = 0; j < 10; j++) {
        const dependantFirstName = faker.person.firstName();
        const dependantLastName = faker.person.lastName();
        const sex = j % 2 === 0 ? Sex.FEMALE : Sex.MALE;

        const dependant = await tx.dependant.create({
          data: {
            family_id: family.id,
            first_name: dependantFirstName,
            last_name: dependantLastName,
            relationship: DependantRelationship.CHILD,
            sex: sex,
            type: DependantType.STUDENT,
            birthdate: faker.date.birthdate({ min: 5, max: 25, mode: 'age' }),
            email: faker.internet.email({ firstName: dependantFirstName, lastName: dependantLastName }),
          },
        });
        dependants.push(DependantMapper.toEntity(dependant));
      }

      const dependantsToApprove = dependants.slice(0, 5);
      for (const dependant of dependantsToApprove) {
        await tx.enrollmentRequest.create({
          data: {
            club_id: club.id,
            family_id: family.id,
            member_id: dependant.id,
            status: EnrollmentStatus.APPROVED,
            resolved_at: new Date(),
          },
        });

        await tx.clubMembership.create({
          data: {
            club_id: club.id,
            family_id: family.id,
            member_id: dependant.id,
            status: MembershipStatus.ACTIVE,
          },
        });
      }

      const dependantsWithPendingRequest = dependants.slice(5, 7);
      for (const dependant of dependantsWithPendingRequest) {
        await tx.enrollmentRequest.create({
          data: {
            club_id: club.id,
            family_id: family.id,
            member_id: dependant.id,
            status: EnrollmentStatus.PENDING,
          },
        });
      }

      console.log(`Unidade de negócio criada para o usuário: ${createdUser.email}`);
    });
  }

  console.log('Seed finalizado com sucesso.');
}

main()
  .catch((e) => {
    console.error('Erro durante o processo de seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
