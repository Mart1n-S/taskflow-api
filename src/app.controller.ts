import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AppService, type AppInfo } from './app.service';
import { Public } from './auth/decorators/public.decorator';

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
}
