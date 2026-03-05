import { Controller, Get } from '@nestjs/common';
import { AppService, type AppInfo } from './app.service';

export interface AppHealth {
  status: string;
  timestamp: string;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): AppInfo {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck(): AppHealth {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
