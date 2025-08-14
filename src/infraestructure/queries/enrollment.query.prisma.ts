import { MyEnrollmentRequestItemView } from '@/application/queries/enrollment-query/my-enrollment-request-item.view';
import { EnrollmentQuery } from '@/application/queries/enrollment-query/enrollment.query';

import { PrismaService } from '@/infraestructure/database/prisma.service';
import { Inject } from '@nestjs/common';

export class EnrollmentQueryPrisma implements EnrollmentQuery {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async myRequests(userId: string): Promise<MyEnrollmentRequestItemView[]> {
    return await this.prisma.$queryRaw<MyEnrollmentRequestItemView[]>`
      SELECT 
        r.id,
        r.status,
        c.name as "clubName",        
        r.resolved_at as "resolvedAt",
        r.requested_at as "requestedAt",
        r.rejection_reason as "rejectionReason",
        CONCAT(d.first_name, ' ', d.last_name) as "dependantName"
      FROM 
        "EnrollmentRequest" AS r
      INNER JOIN 
        "Club" AS c
      ON 
        r.club_id = c.id
      INNER JOIN 
        "Family" as f
      ON 
        r.family_id = f.id
      INNER JOIN
        "Dependant" as d
      ON
        r.member_id = d.id
      WHERE
        f.holder_id = ${userId}
      ORDER BY 
        r.requested_at DESC
      ;
    `;
  }
}
