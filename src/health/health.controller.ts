import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../auth/decorators/public.decorator';
import { SkipTransform } from '../common/decorators/skip-transform.decorator';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  /**
   * Public health check endpoint — used by Docker HEALTHCHECK and load balancers.
   * Verifies that the database connection is alive.
   */
  @Public()
  @SkipTransform()
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: "Vérifier la santé de l'API et de la DB" })
  @ApiOkResponse({ description: 'API et base de données opérationnelles' })
  check() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
