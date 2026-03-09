import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../auth/supabase.service';

@Injectable()
export class UploadService {
  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService,
  ) {}

  async uploadFile(file: Express.Multer.File, bucket: string, userId: string) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const supabase = this.supabaseService.getClient();
    
    // Generate unique filename
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return {
      url: urlData.publicUrl,
      path: fileName,
    };
  }

  async deleteFile(bucket: string, path: string) {
    const supabase = this.supabaseService.getClient();
    
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      throw new BadRequestException(`Delete failed: ${error.message}`);
    }

    return { message: 'File deleted successfully' };
  }
}
