// prisma/seed.ts

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
import User from '@/domain/entities/user/user';

const prisma = new PrismaClient();

// A senha padrão para todos os usuários. Não faça isso em produção.

async function main() {
  console.log('Iniciando o processo de seed...');

  // 1. Limpar o banco de dados para evitar duplicatas. É um reset completo.
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
  // 2. Hashear a senha padrão uma única vez.
  const hashinService = new HashingServiceBcrypt();

  // 3. Criar 10 usuários principais, cada um com sua família, clube, e dependentes.
  console.log('Criando 10 usuários, famílias, clubes e dependentes...');

  for (let i = 0; i < 10; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    // Usamos uma transação para cada "unidade de negócio" (usuário + família + clube).
    // Se algo falhar, tudo é revertido. Isso é integridade, não super-engenharia.
    await prisma.$transaction(async (tx) => {
      // Criar o Usuário (que será o dono do clube e titular da família)
      const user = await tx.user.create({
        data: {
          email: faker.internet.email({ firstName, lastName }),
          first_name: firstName,
          last_name: lastName,
          rg: faker.string.numeric(9),
          cpf: cpfGenerator.gerarCpf(), // Em um cenário real, use um gerador de CPF válido
          phone: faker.phone.number(),
          roles: UserRole.DONO_DE_CLUBE + ',' + UserRoles.SEM_FUNCAO, // Papel definido no Enum
          password: hashinService.hash(User.DEFAULT_PASSWORD),
          street: faker.location.streetAddress(),
          number: faker.location.buildingNumber(),
          neighborhood: faker.location.secondaryAddress(),
          city: faker.location.city(),
          state: faker.location.state({ abbreviated: true }),
          zip_code: faker.location.zipCode('#####-###'), 
        },
      });

      // Criar a Família para este usuário
      const family = await tx.family.create({
        data: {
          holder_id: user.id,
          status: FamilyStatus.AFFILIATED, // Família já afiliada
          affiliated_at: new Date(),
          affiliation_expires_at: faker.date.future({ years: 1 }),
        },
      });

      // Criar o Clube para este usuário
      const club = await tx.club.create({
        data: {
          principal_id: user.id,
          name: `${faker.company.name()} Club`,
          city: user.city,
          state: user.state,
        },
      });

      // Criar 10 Dependentes para esta família
      const dependants: Dependant[] = [];
      for (let j = 0; j < 10; j++) {
        const dependantFirstName = faker.person.firstName();
        const dependantLastName = faker.person.lastName(); // Mesmo sobrenome da família
        const sex = j % 2 === 0 ? Sex.FEMALE : Sex.MALE;

        const dependant = await tx.dependant.create({
          data: {
            family_id: family.id,
            first_name: dependantFirstName,
            last_name: dependantLastName,
            relationship: DependantRelationship.CHILD,
            sex: sex,
            birthdate: faker.date.birthdate({ min: 5, max: 25, mode: 'age' }),
            email: faker.internet.email({ firstName: dependantFirstName, lastName: dependantLastName }),
          },
        });
        dependants.push(DependantMapper.toEntity(dependant));
      }

      // 4. Aprovar 5 dependentes e criar suas matrículas.
      const dependantsToApprove = dependants.slice(0, 5);
      for (const dependant of dependantsToApprove) {
        // Criar a solicitação já aprovada
        await tx.enrollmentRequest.create({
          data: {
            club_id: club.id,
            family_id: family.id,
            member_id: dependant.id,
            status: EnrollmentStatus.APPROVED,
            resolved_at: new Date(),
          },
        });
        // Criar a matrícula do clube (consequência da aprovação)
        await tx.clubMembership.create({
          data: {
            club_id: club.id,
            family_id: family.id,
            member_id: dependant.id,
            status: MembershipStatus.ACTIVE,
          },
        });
      }

      // 5. Criar 2 solicitações pendentes para os próximos dependentes.
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

      console.log(`Unidade de negócio criada para o usuário: ${user.email}`);
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
    // Fechar a conexão com o banco de dados
    await prisma.$disconnect();
  });
