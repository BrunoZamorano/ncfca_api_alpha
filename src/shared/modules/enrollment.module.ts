import { Module } from '@nestjs/common';
import SharedModule from './shared.module';
import RequestEnrollmentUseCase from '@/application/use-cases/request-enrollment/request-enrollment';
import EnrollmentController from '@/infraestructure/controllers/enrollment.controller';

@Module({
  imports: [SharedModule],
  controllers: [EnrollmentController],
  providers: [RequestEnrollmentUseCase],
})
export default class EnrollmentModule {}
