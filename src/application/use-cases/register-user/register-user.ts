import { Inject, Logger } from '@nestjs/common';

import TokenService, { Payload } from '@/application/services/token-service';
import IdGenerator from '@/application/services/id-generator';

import UserFactory from '@/domain/factories/user.factory';
import Family from '@/domain/entities/family/family';

import { USER_FACTORY } from '@/shared/constants/factories-constants';
import { ID_GENERATOR, TOKEN_SERVICE } from '@/shared/constants/service-constants';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';

export default class RegisterUser {
  private readonly logger = new Logger(RegisterUser.name);

  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(USER_FACTORY) private readonly userFactory: UserFactory,
    @Inject(ID_GENERATOR) private readonly idGenerator: IdGenerator,
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
  ) {}

  async execute(input: Input): Promise<{ accessToken: string; refreshToken: string }> {
    return await this.uow.executeInTransaction(async () => {
      this.logger.debug(`Iniciando execução do RegisterUser para o email: ${input.email}`);
      if (await this.emailHasBeenUsed(input.email)) {
        this.logger.debug(`Tentativa de registro com email já em uso: ${input.email}`);
        throw new Error(RegisterUser.errorCodes.EMAIL_ALREADY_IN_USE);
      }
      const user = this.userFactory.create(input);
      const createdUser = await this.uow.userRepository.save(user);
      const familyId = this.idGenerator.generate();
      const familyProps = { holderId: createdUser.id, id: familyId };
      const family = await this.uow.familyRepository.save(new Family(familyProps));
      this.logger.debug(`Family criada e salva com ID: ${family.id} para o holder: ${createdUser.id}`);
      const payload: Payload = {
        sub: createdUser.id,
        roles: createdUser.roles,
        email: createdUser.email,
        familyId: family.id,
      };
      const accessToken = await this.tokenService.signAccessToken(payload);
      const refreshToken = await this.tokenService.signRefreshToken(payload);
      this.logger.debug(`RegisterUser concluído com sucesso para o email: ${input.email}`);
      return { refreshToken, accessToken };
    });
  }

  private async emailHasBeenUsed(email: string): Promise<boolean> {
    const emailUsed = !!(await this.uow.userRepository.findByEmail(email));
    this.logger.debug(`Verificação de email '${email}' retornou: ${emailUsed ? 'em uso' : 'disponível'}`);
    return emailUsed;
  }

  static errorCodes = {
    EMAIL_ALREADY_IN_USE: 'EMAIL_ALREADY_IN_USE',
    INVALID_CPF: 'INVALID_CPF',
  };
}

interface Input {
  firstName: string;
  lastName: string;
  password: string;
  phone: string;
  email: string;
  cpf: string;
}
