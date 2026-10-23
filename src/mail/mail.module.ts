import { Module } from '@nestjs/common';
import { MailController } from './mail.controller.js';
import { MailService } from './mail.service.js';
import { SubmissionGuard } from './submission.guard.js';

@Module({ controllers: [MailController], providers: [MailService, SubmissionGuard] })
export class MailModule {}
