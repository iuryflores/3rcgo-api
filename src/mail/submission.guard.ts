import { CanActivate, ExecutionContext, HttpException, Injectable, OnModuleDestroy, UnsupportedMediaTypeException } from '@nestjs/common';
import type { Request, Response } from 'express';

@Injectable()
export class SubmissionGuard implements CanActivate, OnModuleDestroy {
  private readonly limits = new Map<string, { count: number; until: number }>();
  private readonly cleanup = setInterval(() => {
    for (const [ip, limit] of this.limits) if (limit.until < Date.now()) this.limits.delete(ip);
  }, 60000).unref();

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const forwarded = req.headers['x-real-ip'];
    const ip = (process.env.TRUST_PROXY === 'true' && typeof forwarded === 'string' ? forwarded : req.socket.remoteAddress) || 'unknown';
    let limit = this.limits.get(ip);
    if (!limit || limit.until < Date.now()) {
      limit = { count: 0, until: Date.now() + 15 * 60 * 1000 };
      this.limits.set(ip, limit);
    }
    if (++limit.count > 5) {
      res.setHeader('Retry-After', Math.ceil((limit.until - Date.now()) / 1000));
      throw new HttpException('Aguarde alguns minutos antes de tentar novamente.', 429);
    }
    if (!req.headers['content-type']?.startsWith('application/json')) throw new UnsupportedMediaTypeException('Envie dados em JSON.');
    return true;
  }

  onModuleDestroy() { clearInterval(this.cleanup); }
}
