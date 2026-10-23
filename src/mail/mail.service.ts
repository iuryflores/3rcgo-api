import { BadGatewayException, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { lgpdEmailHtml } from '../email-template.js';
import { emailLogo } from '../email-logo.js';
import { emailText, type ValidatedPayload } from '../validation.js';

@Injectable()
export class MailService implements OnModuleDestroy {
  private readonly logger = new Logger(MailService.name);
  private readonly transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true', requireTLS: process.env.SMTP_SECURE !== 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
  });

  async sendLgpd(data: ValidatedPayload): Promise<void> {
    try {
      const result = await this.transport.sendMail({
        from: process.env.MAIL_FROM, to: process.env.LGPD_TO,
        replyTo: data.email, subject: 'Solicitação de Dados — LGPD',
        text: emailText('lgpd', data), html: lgpdEmailHtml(data),
        attachments: [{ filename: 'logo-cartorio.png', content: emailLogo, cid: 'cartorio-logo', contentType: 'image/png', contentDisposition: 'inline' }],
      });
      if (!result.accepted?.length || result.rejected?.length) throw new Error('SMTP recusou o destinatário.');
    } catch (error: unknown) {
      const failure = error as { code?: string; command?: string; responseCode?: number; response?: string };
      this.logger.error({
        message: 'Falha no envio SMTP.', code: failure?.code || 'desconhecido',
        command: failure?.command, responseCode: failure?.responseCode,
        response: typeof failure?.response === 'string'
          ? failure.response.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]').replace(/[\r\n]+/g, ' ').slice(0, 1000)
          : undefined,
      });
      throw new BadGatewayException('Não foi possível enviar a solicitação. Tente novamente.');
    }
  }

  onModuleDestroy() { this.transport.close(); }
}
