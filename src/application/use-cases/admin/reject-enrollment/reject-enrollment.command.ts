export class AdminRejectEnrollmentCommand {
  constructor(
    public readonly clubId: string,
    public readonly enrollmentId: string,
    public readonly rejectionReason?: string,
  ) {}
}
