import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../auth/supabase.service';
import { UpdateCreatorProfileDto } from './dto';

@Injectable()
export class CreatorsService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll() {
    const supabase = this.supabaseService.getClient();

    const { data: creators } = await supabase
      .from('users')
      .select('*, creators_profile(*)')
      .eq('role', 'creator');

    return Promise.all(
      (creators || []).map(async (creator: any) => {
        const { count } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', creator.id)
          .eq('status', 'active');

        const profile = creator.creators_profile?.[0] || creator.creators_profile;

        return {
          id: creator.id,
          name: creator.full_name || creator.email?.split('@')?.[0] || 'Creator',
          email: creator.email,
          bio: profile?.bio || '',
          category: profile?.category || null,
          priceFcfa: profile?.price_fcfa || 500,
          profileImageUrl: profile?.profile_image_url || null,
          coverImageUrl: profile?.cover_image_url || null,
          subscribersCount: count || 0,
        };
      }),
    );
  }

  async findOne(id: string) {
    const supabase = this.supabaseService.getClient();

    const { data: creator } = await supabase
      .from('users')
      .select('*, creators_profile(*)')
      .eq('id', id)
      .eq('role', 'creator')
      .maybeSingle();

    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .eq('creator_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    const { count: subscribersCount } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', id)
      .eq('status', 'active');

    return {
      ...creator,
      creatorProfile: creator.creators_profile?.[0] || creator.creators_profile || null,
      createdPosts: posts || [],
      subscribersCount: subscribersCount || 0,
    };
  }

  async updateProfile(userId: string, updateDto: UpdateCreatorProfileDto) {
    const supabase = this.supabaseService.getClient();

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!user || user.role !== 'creator') {
      throw new NotFoundException('Creator not found');
    }

    const { data } = await supabase
      .from('creators_profile')
      .update({
        bio: updateDto.bio,
        category: updateDto.category,
        price_fcfa: updateDto.priceFcfa,
        profile_image_url: updateDto.profileImageUrl,
        cover_image_url: updateDto.coverImageUrl,
      })
      .eq('user_id', userId)
      .select()
      .single();

    return data;
  }

  async getCreatorStats(creatorId: string) {
    const supabase = this.supabaseService.getClient();

    const [
      { count: subscribersCount },
      { count: postsCount },
      { data: activeSubscribers },
    ] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorId)
        .eq('status', 'active'),
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorId),
      supabase
        .from('subscriptions')
        .select('*, fan:users!subscriptions_fan_id_fkey(id, email, full_name)')
        .eq('creator_id', creatorId)
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
    ]);

    return {
      subscribersCount: subscribersCount || 0,
      postsCount: postsCount || 0,
      activeSubscribers: activeSubscribers || [],
    };
  }
}
