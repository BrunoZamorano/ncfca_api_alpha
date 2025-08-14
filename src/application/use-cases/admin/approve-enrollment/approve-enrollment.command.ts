export class AdminApproveEnrollmentCommand {
  constructor(
    public readonly clubId: string,
    public readonly enrollmentId: string,
  ) {}
}