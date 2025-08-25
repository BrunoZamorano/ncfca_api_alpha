export class TournamentDetailsView {
  id: string;
  name: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  startDate: Date;
  deletedAt?: Date;
  description: string;
  registrationCount: number;
  registrationEndDate: Date;
  registrationStartDate: Date;
}
