import { InvalidOperationException } from '@/domain/exceptions/domain-exception';
import { MembershipStatus } from '@/domain/enums/membership-status';
import IdGenerator from '@/application/services/id-generator';

export default class ClubMembership {
  public status: MembershipStatus;
  public readonly memberId: string;
  public readonly familyId: string;
  public readonly clubId: string;
  public readonly id: string;

  public constructor(props: ClubMembershipConstructorProps) {
    this.id = props.id;
    this.clubId = props.clubId;
    this.familyId = props.familyId;
    this.memberId = props.memberId;
    this.status = props.status;
  }

  public static create(props: CreateMembershipProps, idGenerator: IdGenerator): ClubMembership {
    return new ClubMembership({
      id: idGenerator.generate(),
      clubId: props.clubId,
      familyId: props.familyId,
      memberId: props.memberId,
      status: MembershipStatus.ACTIVE,
    });
  }

  public revoke(): void {
    if (this.status === MembershipStatus.REVOKED) {
      throw new InvalidOperationException('Membership is already revoked.');
    }
    this.status = MembershipStatus.REVOKED;
  }

  isActive(): boolean {
    return this.status === MembershipStatus.ACTIVE;
  }
}

interface ClubMembershipConstructorProps {
  id: string;
  clubId: string;
  familyId: string;
  memberId: string;
  status: MembershipStatus;
}

interface CreateMembershipProps {
  clubId: string;
  familyId: string;
  memberId: string;
}
