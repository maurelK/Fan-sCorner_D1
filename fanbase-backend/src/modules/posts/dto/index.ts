import { IsNotEmpty, IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ example: 'My awesome post' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'This is the content of my post' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({ example: 'https://example.com/video.mp4', required: false })
  @IsOptional()
  @IsUrl()
  videoUrl?: string;
}

export class UpdatePostDto {
  @ApiProperty({ example: 'Updated title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'Updated content', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ example: 'https://example.com/new-image.jpg', required: false })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({ example: 'https://example.com/new-video.mp4', required: false })
  @IsOptional()
  @IsUrl()
  videoUrl?: string;
}
