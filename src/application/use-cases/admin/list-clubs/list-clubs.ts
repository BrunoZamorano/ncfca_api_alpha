import { Inject, Injectable } from '@nestjs/common';
import ClubRepository from '@/domain/repositories/club-repository';
import { CLUB_REPOSITORY } from '@/shared/constants/repository-constants';
import Club from '@/domain/entities/club/club';

@Injectable()
export default class AdminListClubs {
  constructor(@Inject(CLUB_REPOSITORY) private readonly clubRepository: ClubRepository) {}
  async execute(): Promise<Club[]> {
    return await this.clubRepository.findAll();
  }
}
