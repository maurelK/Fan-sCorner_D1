import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../auth/supabase.service';
import { CreatePostDto, UpdatePostDto } from './dto';

@Injectable()
export class PostsService {
  constructor(private supabaseService: SupabaseService) {}

  async create(userId: string, createPostDto: CreatePostDto) {
    const supabase = this.supabaseService.getClient();

    const { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
    if (!user || user.role !== 'creator') {
      throw new ForbiddenException('Only creators can create posts');
    }

    const { data } = await supabase
      .from('posts')
      .insert({
        creator_id: userId,
        title: createPostDto.title,
        content: createPostDto.content,
        image_url: createPostDto.imageUrl,
        video_url: createPostDto.videoUrl,
      })
      .select('*, creator:users!posts_creator_id_fkey(id, full_name, email, creators_profile(*))')
      .single();

    return data;
  }

  async findAll() {
    const supabase = this.supabaseService.getClient();
    const { data } = await supabase
      .from('posts')
      .select('*, creator:users!posts_creator_id_fkey(id, full_name, email, creators_profile(bio, profile_image_url))')
      .order('created_at', { ascending: false });
    return data || [];
  }

  async getSubscribedPosts(fanId: string) {
    return this.getPostsForFan(fanId);
  }

  async findByCreator(creatorId: string) {
    const supabase = this.supabaseService.getClient();
    const { data } = await supabase
      .from('posts')
      .select('*, creator:users!posts_creator_id_fkey(id, full_name, email, creators_profile(*))')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });
    return data || [];
  }

  async getCreatorPosts(creatorId: string, fanId?: string) {
    const supabase = this.supabaseService.getClient();

    const { data: creator } = await supabase
      .from('users')
      .select('*, creators_profile(*)')
      .eq('id', creatorId)
      .eq('role', 'creator')
      .maybeSingle();

    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });

    let isSubscribed = false;
    if (fanId) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('fan_id', fanId)
        .eq('creator_id', creatorId)
        .eq('status', 'active')
        .maybeSingle();
      isSubscribed = !!subscription;
    }

    return {
      creator: {
        ...creator,
        creatorProfile: creator.creators_profile?.[0] || creator.creators_profile || null,
      },
      posts: posts || [],
      isSubscribed,
    };
  }

  async findOne(id: string) {
    const supabase = this.supabaseService.getClient();
    const { data } = await supabase
      .from('posts')
      .select('*, creator:users!posts_creator_id_fkey(id, full_name, email, creators_profile(*))')
      .eq('id', id)
      .maybeSingle();
    if (!data) throw new NotFoundException('Post not found');
    return data;
  }

  async update(id: string, userId: string, updatePostDto: UpdatePostDto) {
    const supabase = this.supabaseService.getClient();
    const { data: post } = await supabase.from('posts').select('*').eq('id', id).maybeSingle();
    if (!post) throw new NotFoundException('Post not found');
    if (post.creator_id !== userId) throw new ForbiddenException('You can only update your own posts');

    const { data } = await supabase
      .from('posts')
      .update({
        title: updatePostDto.title,
        content: updatePostDto.content,
        image_url: updatePostDto.imageUrl,
        video_url: updatePostDto.videoUrl,
      })
      .eq('id', id)
      .select('*, creator:users!posts_creator_id_fkey(id, full_name, email, creators_profile(*))')
      .single();
    return data;
  }

  async remove(id: string, userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data: post } = await supabase.from('posts').select('*').eq('id', id).maybeSingle();
    if (!post) throw new NotFoundException('Post not found');
    if (post.creator_id !== userId) throw new ForbiddenException('You can only delete your own posts');
    await supabase.from('posts').delete().eq('id', id);
    return { message: 'Post deleted successfully' };
  }

  async getPostsForFan(fanId: string) {
    const supabase = this.supabaseService.getClient();
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('creator_id')
      .eq('fan_id', fanId)
      .eq('status', 'active');

    if (!subscriptions || subscriptions.length === 0) return [];
    const creatorIds = subscriptions.map((sub: any) => sub.creator_id);

    const { data } = await supabase
      .from('posts')
      .select('*, creator:users!posts_creator_id_fkey(id, full_name, email, creators_profile(bio, profile_image_url))')
      .in('creator_id', creatorIds)
      .order('created_at', { ascending: false });

    return data || [];
  }
}
