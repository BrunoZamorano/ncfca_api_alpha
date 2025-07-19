import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import IdGenerator from '@/application/services/id-generator';

import { EntityNotFoundException, InvalidOperationException } from '@/domain/exceptions/domain-exception';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { UserRoles } from '@/domain/enums/user-roles';
import Club from '@/domain/entities/club/club';

import { ID_GENERATOR, TOKEN_SERVICE } from '@/shared/constants/service-constants';
import { FamilyStatus } from '@/domain/enums/family-status';
import TokenService, { Payload } from '@/application/services/token-service';

@Injectable()
export default class CreateClub {
  private logger = new Logger(CreateClub.name);
  constructor(
    @Inject(TOKEN_SERVICE) private readonly _tokenService: TokenService,
    @Inject(ID_GENERATOR) private readonly _idGenerator: IdGenerator,
    @Inject(UNIT_OF_WORK) private readonly _uow: UnitOfWork,
  ) {}

  async execute(input: Input): Promise<{ club: Club; tokens: { accessToken: string; refreshToken: string } }> {
    return this._uow.executeInTransaction(async () => {
      const existingClub = await this._uow.clubRepository.findByOwnerId(input.loggedInUserId);
      if (existingClub) {
        this.logger.debug(`User already owns a club: ${existingClub.id}`);
        throw new InvalidOperationException('User can only own one club.');
      }
      const user = await this._uow.userRepository.find(input.loggedInUserId);
      if (!user) {
        this.logger.debug(`User not found: ${input.loggedInUserId}`);
        throw new EntityNotFoundException('User', input.loggedInUserId);
      }
      const family = await this._uow.familyRepository.findByHolderId(input.loggedInUserId);
      if (!family) {
        this.logger.debug(`Family not found for user: ${input.loggedInUserId}`);
        throw new EntityNotFoundException('Family', input.loggedInUserId);
      }
      if (family.status !== FamilyStatus.AFFILIATED) {
        this.logger.debug(`Family is not affiliated: ${family.id}`);
        throw new InvalidOperationException('Family must be affiliated to create a club.');
      }
      user.assignRoles([UserRoles.DONO_DE_CLUBE]);
      await this._uow.userRepository.save(user);
      const clubInstance = Club.create(
        {
          principalId: input.loggedInUserId,
          state: input.state,
          name: input.name,
          city: input.city,
        },
        this._idGenerator,
      );
      const club = await this._uow.clubRepository.save(clubInstance);
      const payload: Payload = { familyId: family.id, email: user.email, roles: user.roles, sub: user.id };
      this.logger.debug(`Club created successfully: ${club.id}`);
      return {
        club,
        tokens: {
          accessToken: await this._tokenService.signAccessToken(payload),
          refreshToken: await this._tokenService.signRefreshToken(payload),
        },
      };
    });
  }
}

interface Input {
  loggedInUserId: string;
  state: string;
  city: string;
  name: string;
}
