import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

function isMissingPostInteractionsTablesError(error: any): boolean {
  const message = String(error?.message || error || '')
  return /public\.post_likes/i.test(message) || /public\.post_comments/i.test(message) || /Could not find the table/i.test(message)
}

type CommentPayload = {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  users?: {
    full_name?: string | null
    email?: string | null
  } | null
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const creatorId = searchParams.get('creatorId')

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId is required' }, { status: 400 })
    }

    const { data: authData } = await supabase.auth.getUser()
    const currentUserId = authData?.user?.id ?? null

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id')
      .eq('creator_id', creatorId)

    if (postsError) {
      return NextResponse.json({ error: postsError.message }, { status: 500 })
    }

    const postIds = (posts || []).map((post: any) => post.id)

    if (postIds.length === 0) {
      return NextResponse.json({ likesByPost: {}, likedPostIds: [], commentsByPost: {} })
    }

    const [{ data: likes, error: likesError }, { data: comments, error: commentsError }] = await Promise.all([
      supabase
        .from('post_likes')
        .select('post_id, user_id')
        .in('post_id', postIds),
      supabase
        .from('post_comments')
        .select('id, post_id, user_id, content, created_at, users:user_id(full_name, email)')
        .in('post_id', postIds)
        .order('created_at', { ascending: false }),
    ])

    const missingInteractionsTables =
      (likesError && /post_likes/i.test(likesError.message)) ||
      (commentsError && /post_comments/i.test(commentsError.message))

    if (missingInteractionsTables) {
      return NextResponse.json({ likesByPost: {}, likedPostIds: [], commentsByPost: {}, warning: 'post_interactions_tables_missing' })
    }

    if (likesError) {
      return NextResponse.json({ error: likesError.message }, { status: 500 })
    }

    if (commentsError) {
      return NextResponse.json({ error: commentsError.message }, { status: 500 })
    }

    const likesByPost: Record<string, number> = {}
    const likedPostIds = new Set<string>()

    for (const row of likes || []) {
      likesByPost[row.post_id] = (likesByPost[row.post_id] || 0) + 1
      if (currentUserId && row.user_id === currentUserId) {
        likedPostIds.add(row.post_id)
      }
    }

    const commentsByPost: Record<string, Array<{ id: string; content: string; created_at: string; author_name: string }>> = {}

    for (const comment of (comments || []) as CommentPayload[]) {
      if (!commentsByPost[comment.post_id]) {
        commentsByPost[comment.post_id] = []
      }

      commentsByPost[comment.post_id].push({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        author_name: comment.users?.full_name || comment.users?.email || 'Utilisateur',
      })
    }

    return NextResponse.json({
      likesByPost,
      likedPostIds: Array.from(likedPostIds),
      commentsByPost,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, postId, content } = body

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 })
    }

    if (action === 'toggle_like') {
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingLike?.id) {
        const { error } = await supabase.from('post_likes').delete().eq('id', existingLike.id)
        if (error) {
          if (isMissingPostInteractionsTablesError(error)) {
            return NextResponse.json({
              error: "Les tables d'interactions ne sont pas encore créées",
              code: 'post_interactions_tables_missing',
            }, { status: 503 })
          }
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ liked: false })
      }

      const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id })
      if (error) {
        if (isMissingPostInteractionsTablesError(error)) {
          return NextResponse.json({
            error: "Les tables d'interactions ne sont pas encore créées",
            code: 'post_interactions_tables_missing',
          }, { status: 503 })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ liked: true })
    }

    if (action === 'add_comment') {
      if (!content || !String(content).trim()) {
        return NextResponse.json({ error: 'content is required' }, { status: 400 })
      }

      const { data: insertedComment, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: String(content).trim(),
        })
        .select('id, post_id, user_id, content, created_at')
        .single()

      if (error) {
        if (isMissingPostInteractionsTablesError(error)) {
          return NextResponse.json({
            error: "Les tables d'interactions ne sont pas encore créées",
            code: 'post_interactions_tables_missing',
          }, { status: 503 })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ comment: insertedComment })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error: any) {
    if (isMissingPostInteractionsTablesError(error)) {
      return NextResponse.json({
        error: "Les tables d'interactions ne sont pas encore créées",
        code: 'post_interactions_tables_missing',
      }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
