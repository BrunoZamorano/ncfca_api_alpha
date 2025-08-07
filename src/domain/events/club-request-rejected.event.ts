export class ClubRequestRejectedEvent {
  constructor(
    readonly requestId: string,
    readonly requesterId: string,
    readonly reason: string,
  ) {}
}
