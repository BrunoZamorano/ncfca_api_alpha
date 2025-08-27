export class RegistrationConfirmed {
  constructor(
    readonly registrationId: string,
    readonly tournamentId: string,
    readonly competitorId: string,
    readonly isDuo: boolean = false,
  ) {}
}
