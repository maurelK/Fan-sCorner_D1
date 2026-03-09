import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { SupabaseService } from '../auth/supabase.service';
import { CreateSubscriptionDto } from './dto';

@Injectable()
export class SubscriptionsService {
  constructor(private supabaseService: SupabaseService) {}

  async create(fanId: string, createDto: CreateSubscriptionDto) {
    const supabase = this.supabaseService.getClient();

    const { data: creator } = await supabase
      .from('users')
      .select('*')
      .eq('id', createDto.creatorId)
      .maybeSingle();

    if (!creator || creator.role !== 'creator') {
      throw new NotFoundException('Creator not found');
    }

    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('fan_id', fanId)
      .eq('creator_id', createDto.creatorId)
      .eq('status', 'active')
      .maybeSingle();

    if (existingSubscription) {
      throw new ConflictException('Already subscribed to this creator');
    }

    const { data } = await supabase
      .from('subscriptions')
      .insert({ fan_id: fanId, creator_id: createDto.creatorId, status: 'active' })
      .select('*, creator:users!subscriptions_creator_id_fkey(*, creators_profile(*))')
      .single();

    return data;
  }

  async checkSubscription(fanEmail: string, creatorId: string) {
    const supabase = this.supabaseService.getClient();
    const { data: fan } = await supabase.from('users').select('id').eq('email', fanEmail).maybeSingle();
    if (!fan) return { subscribed: false };

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('fan_id', fan.id)
      .eq('creator_id', creatorId)
      .eq('status', 'active')
      .maybeSingle();

    return { subscribed: !!subscription, subscription };
  }

  async getMySubscriptions(fanId: string) {
    const supabase = this.supabaseService.getClient();
    const { data } = await supabase
      .from('subscriptions')
      .select('*, creator:users!subscriptions_creator_id_fkey(id, full_name, email, creators_profile(*))')
      .eq('fan_id', fanId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    return data || [];
  }

  async getFanSubscriptions(fanId: string) {
    return this.getMySubscriptions(fanId);
  }

  async findAll() {
    const supabase = this.supabaseService.getClient();
    const { data } = await supabase
      .from('subscriptions')
      .select('*, fan:users!subscriptions_fan_id_fkey(id, email, full_name), creator:users!subscriptions_creator_id_fkey(id, email, full_name, creators_profile(*))')
      .order('created_at', { ascending: false });
    return data || [];
  }

  async cancelSubscription(fanId: string, creatorId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('fan_id', fanId)
      .eq('creator_id', creatorId)
      .eq('status', 'active')
      .maybeSingle();

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', subscription.id);

    return { message: 'Subscription cancelled' };
  }
}
