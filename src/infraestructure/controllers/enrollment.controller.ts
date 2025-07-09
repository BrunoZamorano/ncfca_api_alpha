import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { RequestEnrollmentDto } from '../dtos/request-enrollment.dto';
import RequestEnrollmentUseCase from '@/application/use-cases/request-enrollment/request-enrollment';
import AuthGuard from '@/shared/guards/auth.guard';

@Controller('enrollments')
@UseGuards(AuthGuard)
export default class EnrollmentController {
  constructor(private readonly requestEnrollmentUseCase: RequestEnrollmentUseCase) {}

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
}
