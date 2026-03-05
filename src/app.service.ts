import { Injectable } from '@nestjs/common';

export interface AppInfo {
  message: string;
  version: string;
}

@Injectable()
export class AppService {
  getHello(): AppInfo {
    return {
      message: 'TaskFlow API',
      version: '1.0.0',
    };
  }
}
