import { IsOptional, IsString, IsInt, Min, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCreatorProfileDto {
  @ApiProperty({ example: 'I create amazing content', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ example: 1000, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceFcfa?: number;

  @ApiProperty({ example: 'Music', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  profileImageUrl?: string;

  @ApiProperty({ example: 'https://example.com/cover.jpg', required: false })
  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;
}
