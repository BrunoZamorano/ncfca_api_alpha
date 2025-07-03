import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import AccountModule from '@/shared/modules/account.module';
import AuthModule from '@/shared/modules/auth-module';
import SharedModule from '@/shared/modules/shared-module';

@Module({
  imports: [AccountModule, AuthModule, SharedModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
