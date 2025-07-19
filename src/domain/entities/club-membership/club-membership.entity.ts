import IdGenerator from '@/application/services/id-generator';

import { MembershipStatus } from '@/domain/enums/membership-status';
import { InvalidOperationException } from '@/domain/exceptions/domain-exception';

export default class ClubMembership {
  public readonly createdAt: Date;
  public status: MembershipStatus;
  public readonly memberId: string;
  public readonly familyId: string;
  public readonly clubId: string;
  public readonly id: string;

  constructor(props: ClubMembershipConstructorProps) {
    this.id = props.id;
    this.clubId = props.clubId;
    this.status = props.status;
    this.familyId = props.familyId;
    this.memberId = props.memberId;
    this.createdAt = props.createdAt ?? new Date();
  }

  public static create(props: CreateMembershipProps, idGenerator: IdGenerator): ClubMembership {
    return new ClubMembership({
      id: idGenerator.generate(),
      clubId: props.clubId,
      status: MembershipStatus.ACTIVE,
      familyId: props.familyId,
      memberId: props.memberId,
    });
  }

  public revoke(): void {
    if (this.status !== MembershipStatus.ACTIVE) {
      throw new InvalidOperationException('Cannot revoke a membership that is not active.');
    }
    this.status = MembershipStatus.REVOKED;
  }

  public reinstate(): void {
    if (this.status !== MembershipStatus.REVOKED) {
      throw new InvalidOperationException('Cannot reinstate a membership that is not revoked.');
    }
    this.status = MembershipStatus.ACTIVE;
  }

  public isActive(): boolean {
    return this.status === MembershipStatus.ACTIVE;
  }
}

interface ClubMembershipConstructorProps {
  id: string;
  clubId: string;
  status: MembershipStatus;
  familyId: string;
  memberId: string;
  createdAt?: Date;
}

interface CreateMembershipProps {
  clubId: string;
  familyId: string;
  memberId: string;
}
