import { Equals, IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LgpdDto {
  @ApiProperty({ description: 'Nome completo do solicitante.', example: 'Pessoa de Teste', maxLength: 500 })
  @IsString() @MaxLength(500) nome!: string;
  @ApiProperty({ example: 'pessoa@example.com', format: 'email', maxLength: 500 })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsEmail() @MaxLength(500) email!: string;
  @ApiProperty({ description: 'Telefone celular.', example: '62999999999', maxLength: 500 })
  @IsString() @MaxLength(500) celular!: string;
  @ApiProperty({ description: 'Identificação por RG e CPF.', example: 'Documento fictício', maxLength: 500 })
  @IsString() @MaxLength(500) documentos!: string;
  @ApiProperty({ description: 'Descrição da solicitação e finalidade.', example: 'Solicito acesso aos meus dados pessoais.', maxLength: 10000 })
  @IsString() @MaxLength(10000) descricao!: string;
  @ApiProperty({ description: 'Direito solicitado.', enum: ['Confirmação de existência de tratamento', 'Acesso completo aos dados', 'Correção ou atualização dos dados', 'Anonimização, bloqueio ou eliminação de dados tratados em desconformidade com a lei', 'Vedação de dados pessoais'], example: 'Acesso completo aos dados', maxLength: 500 })
  @IsString() @MaxLength(500) selectedInfo!: string;
  @ApiProperty({ description: 'Vínculo do solicitante.', enum: ['Cliente/Usuário', 'Colaborador', 'Ex Colaborador', 'Fornecedor/Prestador', 'Outro'], example: 'Cliente/Usuário', maxLength: 500 })
  @IsString() @MaxLength(500) selectedOption!: string;
  @ApiPropertyOptional({ description: 'Obrigatório quando selectedOption for Outro.', maxLength: 500 })
  @IsOptional() @IsString() @MaxLength(500) outroSelected?: string;
  @ApiProperty({ description: 'Aceite do Aviso de Privacidade; deve ser true.', enum: [true], example: true })
  @IsBoolean() @Equals(true) isChecked!: boolean;
}
