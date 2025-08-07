import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { CLUB_EVENTS_SERVICE } from '@/shared/constants/service-constants';
import { ClientProxy } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(CLUB_EVENTS_SERVICE) private readonly client: ClientProxy,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('approve-club-creation')
  async sendoToQueue(@Body() msg: any) {
    this.client.emit('ClubRequest.Approved', msg);
    return { message: 'message sent to queue', body: msg };
  }
}
