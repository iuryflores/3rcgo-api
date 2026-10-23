import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = error instanceof HttpException ? error.getStatus() :
      (error as { status?: number })?.status === 413 ? 413 :
      (error as { status?: number })?.status === 400 ? 400 : 500;
    const msg = error instanceof HttpException ? error.message :
      status === 413 ? 'Solicitação muito grande.' :
      status === 400 ? 'Envie um JSON válido.' : 'Erro interno do servidor.';
    response.status(status).json({ msg });
  }
}
