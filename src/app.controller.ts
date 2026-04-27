import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AppService, type AppInfo } from './app.service';
import { Public } from './auth/decorators/public.decorator';

export interface AppHealth {
  status: string;
  timestamp: string;
}

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Informations sur l'API" })
  @ApiOkResponse({ description: "Informations sur l'API" })
  getHello(): AppInfo {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({ description: 'API opérationnelle' })
  healthCheck(): AppHealth {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
