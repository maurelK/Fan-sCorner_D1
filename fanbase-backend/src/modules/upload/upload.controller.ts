import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('profile-image')
  @ApiOperation({ summary: 'Upload profile image' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadProfileImage(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadService.uploadFile(file, 'profile-images', req.user.id);
  }

  @Post('post-media')
  @ApiOperation({ summary: 'Upload post media (image/video)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadPostMedia(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadService.uploadFile(file, 'post-media', req.user.id);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete file' })
  deleteFile(@Body() body: { bucket: string; path: string }) {
    return this.uploadService.deleteFile(body.bucket, body.path);
  }
}
