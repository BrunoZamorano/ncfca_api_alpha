  import {
  DomainException,
  EntityNotFoundException,
  InvalidOperationException,
} from '@/domain/exceptions/domain-exception';
import IdGenerator from '@/application/services/id-generator';
import ClubMembership from '@/domain/entities/club-membership/club-membership.entity';

export default class Club {
  private readonly _createdAt: Date;
  private readonly _members: ClubMembership[];
  private readonly _id: string;
  private _principalId: string;
  private _state: string;
  private _city: string;
  private _name: string;

  constructor(props: ClubConstructorProps) {
    this._id = props.id;
    this._city = props.city;
    this._name = props.name;
    this._state = props.state;
    this._members = props.members;
    this._createdAt = props.createdAt;
    this._principalId = props.principalId;
  }

  public static create(props: CreateClubProps, idGenerator: IdGenerator): Club {
    if (!props.name || props.name.trim().length < 3) {
      throw new DomainException('Club name is required and must have at least 3 characters.');
    }
    if (!props.city || props.city.trim().length < 3) {
      throw new DomainException('City is required and must have at least 3 characters.');
    }
    return new Club({
      id: idGenerator.generate(),
      name: props.name,
      city: props.city,
      state: props.state,
      members: [],
      createdAt: new Date(),
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

  public updateInfo(props: { name?: string; city?: string; state?: string }): void {
    if (props.name && props.name.trim().length >= 3) {
      this._name = props.name;
    }
    if (props.city && props.city.trim().length >= 3) {
      this._city = props.city;
    }
    if (props.state && props.state.trim().length === 2) {
      this._state = props.state;
    }
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
  get state(): string {
    return this._state;
  }
  get name(): string {
    return this._name;
  }
  get city(): string {
    return this._city;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
}

interface CreateClubProps {
  principalId: string;
  state: string;
  name: string;
  city: string;
}

interface ClubConstructorProps extends CreateClubProps {
  id: string;
  members: ClubMembership[];
  createdAt: Date;
}
