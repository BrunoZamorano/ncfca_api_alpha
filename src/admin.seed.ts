import { NestExpressApplication } from '@nestjs/platform-express';
import { USER_REPOSITORY } from '@/shared/constants/repository-constants';
import UserRepository from '@/domain/repositories/user-repository';
import { UserRoles } from '@/domain/enums/user-roles';
import User from '@/domain/entities/user/user';
import HashingService from '@/domain/services/hashing-service';
import IdGenerator from '@/application/services/id-generator';
import { HASHING_SERVICE, ID_GENERATOR } from '@/shared/constants/service-constants';

export async function adminSeed(app: NestExpressApplication) {
  console.log(`Admin seed app created: ${app}`);
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@ncfca.com.br';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@1234';
  const userRepository = app.get<UserRepository>(USER_REPOSITORY);
  let adminUser = await userRepository.findByEmail(adminEmail);
  const hashingService = app.get<HashingService>(HASHING_SERVICE);
  const idGenerator = app.get<IdGenerator>(ID_GENERATOR);
  if (!adminUser) {
    console.log(`Admin seed app created: ${adminEmail}`);
    adminUser = User.create(
      {
        email: adminEmail,
        password: adminPassword,
        roles: [UserRoles.ADMIN],
        firstName: 'Admin',
        lastName: 'NCFCA',
      },
      idGenerator,
      hashingService,
    );
    await userRepository.save(adminUser);
    console.log(`Admin user created: ${adminEmail}`);
  }
}
