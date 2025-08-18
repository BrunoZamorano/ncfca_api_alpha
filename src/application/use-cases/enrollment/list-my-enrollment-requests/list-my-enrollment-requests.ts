import { Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK, UnitOfWork } from '@/domain/services/unit-of-work';
import { EntityNotFoundException } from '@/domain/exceptions/domain-exception';
import EnrollmentRequest from '@/domain/entities/enrollment-request/enrollment-request';
import { MyEnrollmentRequestItemView } from '@/application/queries/enrollment-query/my-enrollment-request-item.view';
import { QUERY_SERVICE, QueryService } from '@/application/services/query.service';

@Injectable()
export default class ListMyEnrollmentRequests {
  constructor(@Inject(QUERY_SERVICE) private readonly queryService: QueryService) {}

  async execute(loggedInUserId: string): Promise<MyEnrollmentRequestItemView[]> {
    return await this.queryService.enrollmentQuery.myRequests(loggedInUserId);
  }
}
