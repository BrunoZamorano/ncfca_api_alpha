import { NestExpressApplication } from '@nestjs/platform-express';
import { UserRoles } from '@/domain/enums/user-roles';
import User from '@/domain/entities/user/user';
import HashingService from '@/domain/services/hashing-service';
import IdGenerator from '@/application/services/id-generator';
import { HASHING_SERVICE, ID_GENERATOR } from '@/shared/constants/service-constants';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import Family from '@/domain/entities/family/family';
import { FamilyStatus } from '@/domain/enums/family-status';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@ncfca.com.br';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin@1234';

export async function adminSeed(app: NestExpressApplication) {
  console.log(`Admin seed app created: ${app}`);
  const adminPassword = ADMIN_PASSWORD;
  const adminEmail = ADMIN_EMAIL;
  const uow = await app.resolve<UnitOfWork>(UNIT_OF_WORK);
  const idGenerator = app.get<IdGenerator>(ID_GENERATOR);
  const hashingService = app.get<HashingService>(HASHING_SERVICE);
  await uow.executeInTransaction(async function () {
    let adminUser = await uow.userRepository.findByEmail(adminEmail);
    if (adminUser) return;
    adminUser = User.create(
      {
        email: adminEmail,
        password: adminPassword,
        roles: [UserRoles.ADMIN, UserRoles.SEM_FUNCAO],
        firstName: 'Admin',
        lastName: 'NCFCA',
      },
      idGenerator,
      hashingService,
    );
    await uow.userRepository.save(adminUser);
    const family = new Family({
      id: idGenerator.generate(),
      status: FamilyStatus.NOT_AFFILIATED,
      holderId: adminUser.id,
    });
    await uow.familyRepository.save(family);
    console.log(`Admin user created with email: ${adminEmail} and password: ${adminPassword}`);
  });
}
