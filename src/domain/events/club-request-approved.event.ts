export class ClubRequestApprovedEvent {
  constructor(
    readonly requestId: string,
    readonly requesterId: string,
  ) {}
}
