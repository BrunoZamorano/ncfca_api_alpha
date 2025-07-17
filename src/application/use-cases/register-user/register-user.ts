import { Inject, Logger } from '@nestjs/common';

import TokenService, { Payload } from '@/application/services/token-service';
import IdGenerator from '@/application/services/id-generator';

import Family from '@/domain/entities/family/family';

import { HASHING_SERVICE, ID_GENERATOR, TOKEN_SERVICE } from '@/shared/constants/service-constants';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { FamilyStatus } from '@/domain/enums/family-status';
import HashingService from '@/domain/services/hashing-service';
import User from '@/domain/entities/user/user';
import { InvalidOperationException } from '@/domain/exceptions/domain-exception';

export default class RegisterUser {
  private readonly logger = new Logger(RegisterUser.name);

  constructor(
    @Inject(HASHING_SERVICE) private readonly hashingService: HashingService,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
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
      if (await this.cpfHasBeenUsed(input.cpf)) throw new InvalidOperationException('Cpf já cadastrado');
      const user = User.create(input, this.idGenerator, this.hashingService);
      const createdUser = await this.uow.userRepository.save(user);
      const familyId = this.idGenerator.generate();
      const familyProps = { holderId: createdUser.id, id: familyId, status: FamilyStatus.NOT_AFFILIATED };
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

  private async cpfHasBeenUsed(cpf: string): Promise<boolean> {
    return !!(await this.uow.userRepository.findByCpf(cpf));
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
