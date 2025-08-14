import { AddressDto } from '@/domain/dtos/address.dto';

export interface UpdateClubByAdminInput {
  clubId: string;
  data: {
    name?: string;
    maxMembers?: number;
    address?: AddressDto;
  };
}
