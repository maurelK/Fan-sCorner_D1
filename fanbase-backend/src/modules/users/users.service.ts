import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../auth/supabase.service';

@Injectable()
export class UsersService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll() {
    const supabase = this.supabaseService.getClient();

    const { data } = await supabase
      .from('users')
      .select('*, creators_profile(*)');

    return (data || []).map((user: any) => ({
      ...user,
      fullName: user.full_name,
      creatorProfile: user.creators_profile?.[0] || user.creators_profile || null,
    }));
  }

  async findOne(id: string) {
    const supabase = this.supabaseService.getClient();

    const { data } = await supabase
      .from('users')
      .select('*, creators_profile(*)')
      .eq('id', id)
      .maybeSingle();

    if (!data) {
      throw new NotFoundException('User not found');
    }

    return {
      ...data,
      fullName: data.full_name,
      creatorProfile: data.creators_profile?.[0] || data.creators_profile || null,
    };
  }

  async getUserStats(userId: string) {
    const supabase = this.supabaseService.getClient();
    const user = await this.findOne(userId);

    if ((user.role || '').toUpperCase() === 'CREATOR') {
      const [
        { count: subscribersCount },
        { count: postsCount },
        { data: payments },
      ] = await Promise.all([
        supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', userId)
          .eq('status', 'active'),
        supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', userId),
        supabase
          .from('payment_requests')
          .select('amount')
          .eq('creator_id', userId)
          .eq('status', 'completed'),
      ]);

      const totalRevenue = (payments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

      return {
        role: 'CREATOR',
        subscribersCount: subscribersCount || 0,
        postsCount: postsCount || 0,
        totalRevenue,
      };
    }

    const { count: subscriptionsCount } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('fan_id', userId)
      .eq('status', 'active');

    return {
      role: 'FAN',
      subscriptionsCount: subscriptionsCount || 0,
    };
  }
}
