import { BadRequestException, Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { LgpdDto } from './lgpd.dto.js';
import { MailService } from './mail.service.js';
import { SubmissionGuard } from './submission.guard.js';
import { validatePayload, type ValidatedPayload } from '../validation.js';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MessageDto } from '../message.dto.js';

@Controller('terceiro')
@ApiTags('LGPD')
export class MailController {
  constructor(private readonly mail: MailService) {}

  @Post('send-aviso')
  @HttpCode(200)
  @UseGuards(SubmissionGuard)
  @ApiOperation({ summary: 'Enviar solicitação LGPD por e-mail', description: 'Envia ao destinatário configurado no servidor. O solicitante é definido como Reply-To. O sucesso indica aceite pelo SMTP, sem garantir entrega na caixa de entrada.' })
  @ApiResponse({ status: 200, description: 'Mensagem aceita pelo SMTP.', type: MessageDto })
  @ApiResponse({ status: 400, description: 'JSON, campos ou aceite inválidos.', type: MessageDto })
  @ApiResponse({ status: 403, description: 'Origin ausente ou não autorizado.', type: MessageDto })
  @ApiResponse({ status: 413, description: 'Corpo maior que 32 KiB.', type: MessageDto })
  @ApiResponse({ status: 415, description: 'Content-Type deve ser application/json.', type: MessageDto })
  @ApiResponse({ status: 429, description: 'Limite excedido. Consulte Retry-After.', type: MessageDto })
  @ApiResponse({ status: 502, description: 'Falha no envio SMTP.', type: MessageDto })
  async send(@Body() body: LgpdDto) {
    let data: ValidatedPayload;
    try { data = validatePayload('lgpd', body); }
    catch { throw new BadRequestException('Verifique os campos obrigatórios, o e-mail e o aceite.'); }
    await this.mail.sendLgpd(data);
    return { msg: 'Obrigado! Sua mensagem foi enviada!' };
  }
}
