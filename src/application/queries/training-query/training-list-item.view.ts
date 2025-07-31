import { ApiProperty } from '@nestjs/swagger';

export class TrainingListItemView {
  @ApiProperty({ description: 'ID único do treinamento', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Título do treinamento', example: 'Como fazer passes básicos' })
  title: string;

  @ApiProperty({ description: 'Descrição do treinamento', example: 'Aprenda os fundamentos dos passes no futebol' })
  description: string;

  @ApiProperty({ description: 'URL do vídeo no YouTube', example: 'https://youtube.com/watch?v=abc123' })
  youtubeUrl: string;
}
