// src/infraestructure/controllers/enrollment.controller.ts

import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequestEnrollmentDto } from '../dtos/request-enrollment.dto';
import RequestEnrollment from '@/application/use-cases/request-enrollment/request-enrollment';
import AuthGuard from '@/shared/guards/auth.guard';
import ListMyEnrollmentRequests from '@/application/use-cases/list-my-enrollment-requests/list-my-enrollment-requests';
import { EnrollmentRequestDto } from '@/domain/dtos/enrollment-request.dto';

@ApiTags('4. Matrículas (Responsável)')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('enrollments')
export default class EnrollmentController {
  constructor(
    private readonly requestEnrollmentUseCase: RequestEnrollment,
    private readonly listMyEnrollmentRequests: ListMyEnrollmentRequests,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Solicita a matrícula de um dependente em um clube' })
  @ApiResponse({ status: 201, description: 'Solicitação de matrícula criada com sucesso.' })
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
  @ApiOperation({ summary: 'Lista todas as solicitações de matrícula da família do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Lista de solicitações retornada com sucesso.',
    type: [EnrollmentRequestDto],
  })
  async listMyRequests(@Request() req: any) {
    const loggedInUserId = req.user.id;
    return this.listMyEnrollmentRequests.execute(loggedInUserId);
  }
}
