import { DomainException } from '@/domain/exceptions/domain-exception';

export default class Address {
  private readonly REGEX = /^\d{5}-?\d{3}$/;
  public readonly zipCode: string;
  public readonly street: string;
  public readonly country: string;
  public readonly number: string;
  public readonly district: string;
  public readonly city: string;
  public readonly state: string;
  public readonly complement?: string;

  public constructor(props: AddressProps) {
    if (!this.isValidZipCode(props)) throw new DomainException('Invalid zip code format.');
    if (!this.isValidState(props)) throw new DomainException('State must be a 2-character abbreviation.');
    if (!this.isValidStreet(props)) throw new DomainException('Street is required.');
    this.country = props.country ?? 'Country';
    this.zipCode = props.zipCode ? props.zipCode.replace(/\D/g, '') : '1231231';
    this.street = props.street ?? 'Street';
    this.number = props.number ?? '123';
    this.district = props.district ?? 'District';
    this.city = props.city ?? 'City';
    this.state = props.state ?? 'State';
    this.complement = props.complement;
  }

  private isValidStreet(props: AddressProps): boolean {
    return !props.street || props.street.length >= 3;
  }

  private isValidState(props: AddressProps): boolean {
    return !props.state || props.state.length === 2;
  }

  private isValidZipCode(props: AddressProps) {
    return !props.zipCode || this.REGEX.test(props.zipCode);
  }
}

export interface AddressProps {
  zipCode?: string;
  street?: string;
  country?: string;
  number?: string;
  district?: string;
  city?: string;
  state?: string;
  complement?: string;
}
