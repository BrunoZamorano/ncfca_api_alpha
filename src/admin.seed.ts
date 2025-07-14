import { NestExpressApplication } from '@nestjs/platform-express';
import { USER_REPOSITORY } from '@/shared/constants/repository-constants';
import UserRepository from '@/domain/repositories/user-repository';
import UserFactory from '@/domain/factories/user.factory';
import { USER_FACTORY } from '@/shared/constants/factories-constants';
import { UserRoles } from '@/domain/enums/user-roles';

export async function adminSeed(app: NestExpressApplication) {
  console.log(`Admin seed app created: ${app}`);
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@ncfca.com.br';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@1234';
  const userRepository = app.get<UserRepository>(USER_REPOSITORY);
  const userFactory = app.get<UserFactory>(USER_FACTORY);
  let adminUser = await userRepository.findByEmail(adminEmail);
  if (!adminUser) {
    console.log(`Admin seed app created: ${adminEmail}`);
    adminUser = userFactory.create({
      email: adminEmail,
      password: adminPassword,
      roles: [UserRoles.ADMIN],
      firstName: 'Admin',
      lastName: 'NCFCA',
    });
    await userRepository.save(adminUser);
    console.log(`Admin user created: ${adminEmail}`);
  }
}

