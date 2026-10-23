import { ApiProperty } from '@nestjs/swagger';

export class MessageDto {
  @ApiProperty({ description: 'Mensagem retornada pela API.', example: 'Obrigado! Sua mensagem foi enviada!' })
  msg!: string;
}
