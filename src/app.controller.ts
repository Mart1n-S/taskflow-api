import { Controller, Get } from '@nestjs/common';
import { AppService, type AppInfo } from './app.service';
import { Public } from './auth/decorators/public.decorator';

export interface AppHealth {
  status: string;
  timestamp: string;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): AppInfo {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  healthCheck(): AppHealth {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
