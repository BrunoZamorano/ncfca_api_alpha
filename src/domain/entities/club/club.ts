import {
  DomainException,
  EntityNotFoundException,
  InvalidOperationException,
} from '@/domain/exceptions/domain-exception';
import IdGenerator from '@/application/services/id-generator';
import ClubMembership from '@/domain/entities/club-membership/club-membership.entity';
import Address from '@/domain/value-objects/address/address';

export default class Club {
  private readonly _createdAt: Date;
  private readonly _members: ClubMembership[];
  private readonly _id: string;
  private _principalId: string;
  private _maxMembers?: number;
  private _address: Address;
  private _name: string;

  constructor(props: ClubConstructorProps) {
    this._id = props.id;
    this._name = props.name;
    this._address = props.address;
    this._members = props.members;
    this._createdAt = props.createdAt;
    this._maxMembers = props.maxMembers;
    this._principalId = props.principalId;
  }

  public static create(props: CreateClubProps, idGenerator: IdGenerator): Club {
    if (!props.name || props.name.trim().length < 3) {
      throw new InvalidOperationException('Club name is required and must have at least 3 characters.');
    }
    if (!props.address) {
      throw new InvalidOperationException('Address is required.');
    }
    if (props.maxMembers && props.maxMembers < 1) {
      throw new InvalidOperationException('Max members is required and must be greater than 0.');
    }
    return new Club({
      id: idGenerator.generate(),
      name: props.name,
      address: props.address,
      members: [],
      createdAt: new Date(),
      maxMembers: props.maxMembers,
      principalId: props.principalId,
    });
  }

  public addMember(memberId: string, familyId: string, idGenerator: IdGenerator): void {
    let membership = this.findMembershipByDependantId(memberId);
    if (membership?.isActive()) {
      throw new InvalidOperationException(`Dependant ${memberId} is already an active member of this club.`);
    }
    if (membership) {
      membership.reinstate();
    } else {
      const newMembership = ClubMembership.create(
        {
          clubId: this._id,
          memberId: memberId,
          familyId,
        },
        idGenerator,
      );
      this._members.push(newMembership);
    }
  }

  public removeMember(memberId: string): void {
    const membership = this.findMembershipByDependantId(memberId);
    if (!membership || !membership.isActive()) {
      throw new EntityNotFoundException('ClubMembership', `${memberId} is not an active member of this club.`);
    }
    membership.revoke();
  }

  public updateInfo(props: UpdateClubInfoProps): void {
    if (props.name && props.name.trim().length >= 3) this._name = props.name;
    if (props.address) this._address = props.address;
    if (props.maxMembers) this._maxMembers = props.maxMembers;
  }

  public changeOwner(newOwnerId: string): void {
    if (!newOwnerId) {
      throw new DomainException('New owner ID cannot be empty.');
    }
    if (this._principalId === newOwnerId) {
      throw new InvalidOperationException('New director cannot be the same as the current one.');
    }
    this._principalId = newOwnerId;
  }

  private findMembershipByDependantId(dependantId: string): ClubMembership | undefined {
    return this._members.find((m) => m.memberId === dependantId);
  }

  get members(): Readonly<ClubMembership[]> {
    return this._members;
  }

  get id(): string {
    return this._id;
  }
  get principalId(): string {
    return this._principalId;
  }
  get maxMembers() {
    return this._maxMembers;
  }
  get address(): Address {
    return this._address;
  }
  get name(): string {
    return this._name;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
}

interface CreateClubProps {
  principalId: string;
  maxMembers?: number;
  address: Address;
  name: string;
}

interface ClubConstructorProps extends CreateClubProps {
  createdAt: Date;
  members: ClubMembership[];
  id: string;
}

interface UpdateClubInfoProps {
  maxMembers?: number;
  address?: Address;
  name?: string;
}
