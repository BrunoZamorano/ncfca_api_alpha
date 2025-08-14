import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infraestructure/database/prisma.service';

export interface ClubChartsData {
  memberCountByType: {
    type: string;
    count: number;
  }[];
  enrollmentsOverTime: {
    month: string;
    count: number;
  }[];
  memberCountBySex: {
    sex: string;
    count: number;
  }[];
  totalActiveMembers: number;
  totalPendingEnrollments: number;
}

@Injectable()
export class GetClubChartsQueryPrisma {
  constructor(private readonly prisma: PrismaService) {}

  async execute(clubId: string): Promise<ClubChartsData> {
    // Buscar contagem de membros por tipo
    const memberCountByType = await this.prisma.$queryRaw<Array<{ type: string; count: BigInt }>>`
      SELECT d.type, COUNT(*) as count
      FROM "ClubMembership" cm
      INNER JOIN "Dependant" d ON cm.member_id = d.id
      WHERE cm.club_id = ${clubId} AND cm.status = 'ACTIVE'
      GROUP BY d.type
    `;

    // Buscar matrículas nos últimos 12 meses
    const enrollmentsOverTime = await this.prisma.$queryRaw<Array<{ month: string; count: BigInt }>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', requested_at), 'YYYY-MM') as month,
        COUNT(*) as count
      FROM "EnrollmentRequest"
      WHERE club_id = ${clubId} 
        AND requested_at >= NOW() - INTERVAL '12 months'
        AND status = 'APPROVED'
      GROUP BY DATE_TRUNC('month', requested_at)
      ORDER BY month
    `;

    // Buscar contagem de membros por sexo
    const memberCountBySex = await this.prisma.$queryRaw<Array<{ sex: string; count: BigInt }>>`
      SELECT d.sex, COUNT(*) as count
      FROM "ClubMembership" cm
      INNER JOIN "Dependant" d ON cm.member_id = d.id
      WHERE cm.club_id = ${clubId} AND cm.status = 'ACTIVE'
      GROUP BY d.sex
    `;

    // Buscar total de membros ativos
    const totalActiveMembers = await this.prisma.clubMembership.count({
      where: {
        club_id: clubId,
        status: 'ACTIVE',
      },
    });

    // Buscar total de solicitações pendentes
    const totalPendingEnrollments = await this.prisma.enrollmentRequest.count({
      where: {
        club_id: clubId,
        status: 'PENDING',
      },
    });

    return {
      memberCountByType: memberCountByType.map(item => ({
        type: item.type,
        count: Number(item.count),
      })),
      enrollmentsOverTime: enrollmentsOverTime.map(item => ({
        month: item.month,
        count: Number(item.count),
      })),
      memberCountBySex: memberCountBySex.map(item => ({
        sex: item.sex,
        count: Number(item.count),
      })),
      totalActiveMembers,
      totalPendingEnrollments,
    };
  }
}