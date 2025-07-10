import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { RequestEnrollmentDto } from '../dtos/request-enrollment.dto';
import RequestEnrollment from '@/application/use-cases/request-enrollment/request-enrollment';
import AuthGuard from '@/shared/guards/auth.guard';
import ListMyEnrollmentRequests from '@/application/use-cases/list-my-enrollment-requests/list-my-enrollment-requests';

@Controller('enrollments')
@UseGuards(AuthGuard)
export default class EnrollmentController {
  constructor(
    private readonly requestEnrollmentUseCase: RequestEnrollment,
    private readonly listMyEnrollmentRequests: ListMyEnrollmentRequests,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async request(@Request() req: any, @Body() body: RequestEnrollmentDto): Promise<void> {
    const loggedInUserId = req.user.id;
    await this.requestEnrollmentUseCase.execute({
      loggedInUserId,
      dependantId: body.dependantId,
      clubId: body.clubId,
    });
  }

  @Get('my-requests')
  @HttpCode(HttpStatus.OK)
  async listMyRequests(@Request() req: any) {
    const loggedInUserId = req.user.id;
    return this.listMyEnrollmentRequests.execute(loggedInUserId);
  }
}