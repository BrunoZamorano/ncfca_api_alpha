import { Module } from '@nestjs/common';

import AuthModule from '@/shared/modules/auth-module';
import ClubModule from '@/shared/modules/club.module';
import SharedModule from '@/shared/modules/shared-module';
import AccountModule from '@/shared/modules/account.module';

import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';

@Module({
  imports: [AccountModule, AuthModule, SharedModule, ClubModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
