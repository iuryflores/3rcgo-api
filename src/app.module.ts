import { Controller, Get, Module, Redirect } from '@nestjs/common';
import { MailModule } from './mail/mail.module.js';
import { ApiExcludeEndpoint, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller()
@ApiTags('Health')
class HealthController {
  @Get()
  @Redirect('/docs', 302)
  @ApiExcludeEndpoint()
  documentation() {}

  @Get('health')
  @ApiOperation({ summary: 'Verificar disponibilidade da API' })
  @ApiOkResponse({ description: 'API disponível. Não verifica o SMTP.', schema: { type: 'object', required: ['msg'], properties: { msg: { type: 'string', example: 'ok' } } } })
  health() { return { msg: 'ok' }; }
}

@Module({ imports: [MailModule], controllers: [HealthController] })
export class AppModule {}
