import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class CreateTrainingDto {
  @ApiProperty({ description: 'Título do treinamento', example: 'Como fazer passes básicos' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Descrição do treinamento', example: 'Aprenda os fundamentos dos passes no futebol' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'URL do vídeo no YouTube', example: 'https://youtube.com/watch?v=abc123' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  youtubeUrl: string;
}

export class UpdateTrainingDto extends CreateTrainingDto {}

export class TrainingResponseDto {
  @ApiProperty({ description: 'ID único do treinamento', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Título do treinamento' })
  title: string;

  @ApiProperty({ description: 'Descrição do treinamento' })
  description: string;

  @ApiProperty({ description: 'URL do vídeo no YouTube' })
  youtubeUrl: string;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}