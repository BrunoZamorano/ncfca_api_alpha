export interface ClubMemberDto {
  id: string;
  dependantId: string;
  dependantName: string;
  dependantAge: number;
  dependantType: string;
  dependantSex: string;
  dependantEmail: string | null;
  dependantPhone: string | null;
  dependantBirthDate: string;
  joinedAt: string;
  status: string;
  holder: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    cpf: string;
  };
}

export interface ClubQuery {
  getClubMembersListView(clubId: string): Promise<ClubMemberDto[]>;
}

export const CLUB_QUERY = Symbol('CLUB_QUERY');