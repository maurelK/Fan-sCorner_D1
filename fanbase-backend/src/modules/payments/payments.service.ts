import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../auth/supabase.service';
import { CreatePaymentRequestDto, VerifyPaymentDto } from './dto';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(
    private supabaseService: SupabaseService,
    private configService: ConfigService,
  ) {}

  async createPaymentRequest(createDto: CreatePaymentRequestDto) {
    const supabase = this.supabaseService.getClient();

    const { data: creator } = await supabase
      .from('users')
      .select('*, creators_profile(*)')
      .eq('id', createDto.creatorId)
      .maybeSingle();

    if (!creator || creator.role !== 'creator') {
      throw new NotFoundException('Creator not found');
    }

    let { data: fan } = await supabase
      .from('users')
      .select('*')
      .eq('email', createDto.userEmail)
      .maybeSingle();

    if (!fan) {
      const { data: newFan } = await supabase
        .from('users')
        .insert({
          id: createDto.fanId || randomUUID(),
          email: createDto.userEmail,
          full_name: createDto.userName,
          role: 'fan',
        })
        .select()
        .single();
      fan = newFan;
    }

    const { data: paymentRequest } = await supabase
      .from('payment_requests')
      .insert({
        creator_id: createDto.creatorId,
        fan_id: fan.id,
        user_name: createDto.userName,
        user_email: createDto.userEmail,
        user_phone: createDto.userPhone,
        amount: createDto.amount,
        payment_provider: createDto.paymentProvider,
        status: 'pending',
      })
      .select('*, creator:users!payment_requests_creator_id_fkey(*, creators_profile(*))')
      .single();

    return {
      paymentRequest,
      paymentUrl: this.generatePaymentUrl(paymentRequest),
    };
  }

  async verifyPayment(verifyDto: VerifyPaymentDto) {
    const supabase = this.supabaseService.getClient();

    const { data: paymentRequest } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('transaction_id', verifyDto.transactionId)
      .maybeSingle();

    if (!paymentRequest) {
      throw new NotFoundException('Payment request not found');
    }

    await supabase
      .from('payment_requests')
      .update({ status: 'completed' })
      .eq('id', paymentRequest.id);

    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('fan_id', paymentRequest.fan_id)
      .eq('creator_id', paymentRequest.creator_id)
      .maybeSingle();

    if (existingSubscription) {
      await supabase
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('id', existingSubscription.id);
    } else {
      await supabase
        .from('subscriptions')
        .insert({
          fan_id: paymentRequest.fan_id,
          creator_id: paymentRequest.creator_id,
          status: 'active',
        });
    }

    return {
      success: true,
      message: 'Payment verified and subscription activated',
    };
  }

  async getPaymentRequests(creatorId: string) {
    const supabase = this.supabaseService.getClient();
    const { data } = await supabase
      .from('payment_requests')
      .select('id, status, amount, created_at, transaction_id, fan:users!payment_requests_fan_id_fkey(id, full_name, email)')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });
    return data || [];
  }

  async confirmPayment(requestId: string, userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: actor } = await supabase.from('users').select('id, role').eq('id', userId).maybeSingle();
    if (!actor || (actor.role !== 'admin' && actor.role !== 'creator')) {
      throw new ForbiddenException('Not allowed');
    }

    const { data: paymentRequest } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (!paymentRequest) {
      throw new NotFoundException('Payment request not found');
    }

    await supabase
      .from('payment_requests')
      .update({ status: 'completed' })
      .eq('id', requestId);

    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('fan_id', paymentRequest.fan_id)
      .eq('creator_id', paymentRequest.creator_id)
      .maybeSingle();

    if (existingSubscription) {
      await supabase.from('subscriptions').update({ status: 'active' }).eq('id', existingSubscription.id);
    } else {
      await supabase.from('subscriptions').insert({
        fan_id: paymentRequest.fan_id,
        creator_id: paymentRequest.creator_id,
        status: 'active',
      });
    }

    return { success: true };
  }

  private generatePaymentUrl(paymentRequest: any): string {
    const amount = paymentRequest.amount;
    const callbackUrl = `${this.configService.get('APP_URL')}/api/payments/callback`;
    return `https://kkiapay.me/pay?amount=${amount}&callback=${callbackUrl}&transaction_id=${paymentRequest.id}`;
  }
}
