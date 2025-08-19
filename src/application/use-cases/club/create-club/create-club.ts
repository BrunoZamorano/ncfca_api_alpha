import { Inject, Injectable, Logger } from '@nestjs/common';

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
  private readonly logger = new Logger(CreateClub.name);

  constructor(
    @Inject(TOKEN_SERVICE) private readonly _tokenService: TokenService,
    @Inject(ID_GENERATOR) private readonly _idGenerator: IdGenerator,
    @Inject(UNIT_OF_WORK) private readonly _uow: UnitOfWork,
  ) {}

  async execute(input: Input): Promise<{ club: Club; tokens: { accessToken: string; refreshToken: string } }> {
    this.logger.debug(`[GEMINI_DEBUG] CreateClub use case triggered for request: ${input.requestId}`);
    return this._uow.executeInTransaction(async () => {
      const clubRequest = await this._uow.clubRequestRepository.findById(input.requestId);
      if (!clubRequest) throw new EntityNotFoundException('ClubRequest', input.requestId);
      const existingClub = await this._uow.clubRepository.findByPrincipalId(clubRequest.requesterId);
      if (existingClub) {
        this.logger.debug(`User already owns a club: ${existingClub.id}`);
        throw new InvalidOperationException('User can only own one club.');
      }
      const user = await this._uow.userRepository.find(clubRequest.requesterId);
      if (!user) {
        this.logger.debug(`User not found: ${clubRequest.requesterId}`);
        throw new EntityNotFoundException('User', clubRequest.requesterId);
      }
      const family = await this._uow.familyRepository.findByHolderId(clubRequest.requesterId);
      if (!family) {
        this.logger.debug(`Family not found for user: ${clubRequest.requesterId}`);
        throw new EntityNotFoundException('Family', clubRequest.requesterId);
      }
      if (family.status !== FamilyStatus.AFFILIATED) {
        this.logger.debug(`Family is not affiliated: ${family.id}`);
        throw new InvalidOperationException('Family must be affiliated to create a club.');
      }
      user.assignRoles([UserRoles.DONO_DE_CLUBE]);
      await this._uow.userRepository.save(user);
      const clubInstance = Club.create(
        {
          principalId: clubRequest.requesterId,
          maxMembers: clubRequest.maxMembers,
          address: clubRequest.address,
          name: clubRequest.clubName,
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
  requestId: string;
}
