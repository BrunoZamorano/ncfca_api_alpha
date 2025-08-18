import { Module } from '@nestjs/common';
import SharedModule from './shared.module';
import RequestEnrollment from '@/application/use-cases/enrollment/request-enrollment/request-enrollment';
import EnrollmentController from '@/infraestructure/controllers/enrollment.controller';
import ListMyEnrollmentRequests from '@/application/use-cases/enrollment/list-my-enrollment-requests/list-my-enrollment-requests';

@Module({
  imports: [SharedModule],
  controllers: [EnrollmentController],
  providers: [RequestEnrollment, ListMyEnrollmentRequests],
})
export default class EnrollmentModule {}
