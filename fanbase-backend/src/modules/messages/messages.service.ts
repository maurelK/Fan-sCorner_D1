import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { SupabaseService } from '../auth/supabase.service';
import { CreateMessageDto } from './dto';

@Injectable()
export class MessagesService {
  constructor(private supabaseService: SupabaseService) {}

  private isMissingMessagesTableError(error: any): boolean {
    const message = String(error?.message || error || '');
    return /public\.messages/i.test(message) || /Could not find the table/i.test(message);
  }

  async create(senderId: string, createDto: CreateMessageDto) {
    const supabase = this.supabaseService.getClient();
    
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: createDto.receiverId,
        content: createDto.content,
      })
      .select('*, sender:users!messages_sender_id_fkey(id, full_name, email), receiver:users!messages_receiver_id_fkey(id, full_name, email)')
      .single();

    if (error) {
      if (this.isMissingMessagesTableError(error)) {
        throw new ServiceUnavailableException("La table public.messages n'existe pas encore sur Supabase");
      }
      throw new ServiceUnavailableException(error.message || 'Unable to create message');
    }

    return message;
  }

  async findConversation(userId: string, otherUserId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, sender:users!messages_sender_id_fkey(id, full_name, email), receiver:users!messages_receiver_id_fkey(id, full_name, email)')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (error) {
      if (this.isMissingMessagesTableError(error)) {
        throw new ServiceUnavailableException("La table public.messages n'existe pas encore sur Supabase");
      }
      throw new ServiceUnavailableException(error.message || 'Unable to load conversation');
    }

    return messages || [];
  }

  async getContacts(userId: string) {
    const supabase = this.supabaseService.getClient();
    
    // Get all users this user has messaged with
    const { data: sentMessages, error: sentError } = await supabase
      .from('messages')
      .select('receiver_id')
      .eq('sender_id', userId);

    const { data: receivedMessages, error: receivedError } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('receiver_id', userId);

    const firstError = sentError || receivedError;
    if (firstError) {
      if (this.isMissingMessagesTableError(firstError)) {
        throw new ServiceUnavailableException("La table public.messages n'existe pas encore sur Supabase");
      }
      throw new ServiceUnavailableException(firstError.message || 'Unable to load contacts');
    }

    const contactIds = new Set([
      ...(sentMessages || []).map(m => m.receiver_id),
      ...(receivedMessages || []).map(m => m.sender_id),
    ]);

    if (contactIds.size === 0) {
      return [];
    }

    const { data: contacts } = await supabase
      .from('users')
      .select('id, full_name, email, role')
      .in('id', Array.from(contactIds));

    return contacts || [];
  }

  async markAsRead(messageId: string, userId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .eq('receiver_id', userId);

    if (error) {
      if (this.isMissingMessagesTableError(error)) {
        throw new ServiceUnavailableException("La table public.messages n'existe pas encore sur Supabase");
      }
      throw new ServiceUnavailableException(error.message || 'Unable to mark message as read');
    }

    return { message: 'Message marked as read' };
  }

  async getUnreadCount(userId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (error) {
      if (this.isMissingMessagesTableError(error)) {
        throw new ServiceUnavailableException("La table public.messages n'existe pas encore sur Supabase");
      }
      throw new ServiceUnavailableException(error.message || 'Unable to count unread messages');
    }

    return { count: count || 0 };
  }
}
