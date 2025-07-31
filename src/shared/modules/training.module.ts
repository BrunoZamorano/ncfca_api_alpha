import { Module } from '@nestjs/common';
import SharedModule from './shared.module';
import RequestEnrollment from '@/application/use-cases/request-enrollment/request-enrollment';
import EnrollmentController from '@/infraestructure/controllers/enrollment.controller';
import ListMyEnrollmentRequests from '@/application/use-cases/list-my-enrollment-requests/list-my-enrollment-requests';
import { TrainingController } from '@/infraestructure/controllers/training/training.controller';
import { ListTrainings } from '@/application/use-cases/training/list-training/list-trainings.use-case';
import { CreateTraining } from '@/application/use-cases/training/create-training/create-training.use-case';
import { UpdateTraining } from '@/application/use-cases/training/update-training/update-training.use.case';
import { DeleteTraining } from '@/application/use-cases/training/delete-training/delete-training.use-case';

@Module({
  imports: [SharedModule],
  controllers: [TrainingController],
  providers: [ListTrainings, CreateTraining, UpdateTraining, DeleteTraining],
})
export default class TrainingModule {}
