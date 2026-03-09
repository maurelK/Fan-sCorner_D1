import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get('SUPABASE_URL');
    const supabaseKey = this.configService.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('Supabase credentials not found in environment');
      throw new Error('Supabase configuration is missing');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.logger.log('✅ Supabase client initialized');
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  // Database access methods (direct replacement for Prisma)
  get db() {
    return {
      user: {
        findUnique: async (params: any) => {
          const { data, error } = await this.supabase
            .from('users')
            .select('*, creators_profile(*)')
            .eq('id', params.where.id)
            .maybeSingle();

          if (error) {
            throw error;
          }
          
          return data ? {
            ...data,
            creatorProfile: data.creators_profile?.[0] || data.creators_profile || null,
            fullName: data.full_name,
          } : null;
        },
        create: async (params: any) => {
          const basePayload = {
            id: params.data.id,
            email: params.data.email,
            full_name: params.data.fullName,
          };

          const payloadWithRole = {
            ...basePayload,
            role: params.data.role?.toLowerCase?.(),
          };

          let data: any = null;
          let error: any = null;

          ({ data, error } = await this.supabase
            .from('users')
            .insert(payloadWithRole)
            .select()
            .single());

          if (error && String(error.message || '').includes("'role' column")) {
            ({ data, error } = await this.supabase
              .from('users')
              .insert(basePayload)
              .select()
              .single());
          }

          if (error) {
            throw error;
          }
          
          return data ? {
            ...data,
            fullName: data.full_name,
          } : null;
        },
        update: async (params: any) => {
          const basePayload = {
            full_name: params.data.fullName,
          };

          const payloadWithRole = {
            ...basePayload,
            role: params.data.role?.toLowerCase?.(),
          };

          let data: any = null;
          let error: any = null;

          ({ data, error } = await this.supabase
            .from('users')
            .update(payloadWithRole)
            .eq('id', params.where.id)
            .select()
            .single());

          if (error && String(error.message || '').includes("'role' column")) {
            ({ data, error } = await this.supabase
              .from('users')
              .update(basePayload)
              .eq('id', params.where.id)
              .select()
              .single());
          }

          if (error) {
            throw error;
          }
          
          return data ? {
            ...data,
            fullName: data.full_name,
          } : null;
        },
      },
      creatorProfile: {
        create: async (params: any) => {
          const { data } = await this.supabase
            .from('creators_profile')
            .insert({
              user_id: params.data.userId,
              bio: params.data.bio,
              price_fcfa: params.data.priceFcfa,
              category: params.data.category,
            })
            .select()
            .single();
          
          return data ? {
            ...data,
            userId: data.user_id,
            priceFcfa: data.price_fcfa,
            profileImageUrl: data.profile_image_url,
            coverImageUrl: data.cover_image_url,
          } : null;
        },
      },
    };
  }

  async verifyToken(token: string) {
    const { data, error } = await this.supabase.auth.getUser(token);
    if (error) {
      throw error;
    }
    return data.user;
  }

  async getUserById(userId: string) {
    const { data, error } = await this.supabase.auth.admin.getUserById(userId);
    if (error) {
      throw error;
    }
    return data.user;
  }
}
