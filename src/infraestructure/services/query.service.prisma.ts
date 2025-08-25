import { Inject } from '@nestjs/common';

import { EnrollmentQuery } from '@/application/queries/enrollment-query/enrollment.query';
import { DependantQuery } from '@/application/queries/dependant-query/dependant.query';
import { TrainingQuery } from '@/application/queries/training-query/training.query';
import { ClubQuery } from '@/application/queries/club-query/club.query';
import { TournamentQuery } from '@/application/queries/tournament-query/tournament.query';
import { QueryService } from '@/application/services/query.service';
import { ENROLLMENT_QUERY, DEPENDANT_QUERY, TRAINING_QUERY, CLUB_QUERY, TOURNAMENT_QUERY } from '@/shared/constants/query-constants';

export default class QueryServicePrisma implements QueryService {
  constructor(
    @Inject(TRAINING_QUERY) readonly trainingQuery: TrainingQuery,
    @Inject(DEPENDANT_QUERY) readonly dependantQuery: DependantQuery,
    @Inject(ENROLLMENT_QUERY) readonly enrollmentQuery: EnrollmentQuery,
    @Inject(CLUB_QUERY) readonly clubQuery: ClubQuery,
    @Inject(TOURNAMENT_QUERY) readonly tournamentQuery: TournamentQuery,
  ) {}
}
