import { Module } from '@nestjs/common';

import AuthModule from '@/shared/modules/auth.module';
import ClubModule from '@/shared/modules/club.module';
import SharedModule from '@/shared/modules/shared.module';
import AccountModule from '@/shared/modules/account.module';
import WebhookModule from '@/shared/modules/webhook.module';
import CheckoutModule from '@/shared/modules/checkout.module';

import { AppService } from '@/app.service';
import { AppController } from '@/app.controller';
import DependantModule from '@/shared/modules/dependant.module';
import EnrollmentModule from '@/shared/modules/enrollment.module';
import ClubManagementModule from '@/shared/modules/club-management.module';
import AdminModule from '@/shared/modules/admin.module';
import TrainingModule from '@/shared/modules/training.module';
import ClubRequestModule from '@/shared/modules/club-request.module';

@Module({
  imports: [
    AuthModule,
    ClubModule,
    AdminModule,
    SharedModule,
    AccountModule,
    WebhookModule,
    TrainingModule,
    CheckoutModule,
    DependantModule,
    EnrollmentModule,
    ClubManagementModule,
    ClubRequestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
