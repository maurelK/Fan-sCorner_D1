import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

function isMissingInteractionsTables(error: any): boolean {
  const message = String(error?.message || error || '')
  return /post_likes|post_comments/i.test(message) || /Could not find the table/i.test(message)
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id')
      .eq('creator_id', user.id)

    if (postsError) {
      return NextResponse.json({ error: postsError.message }, { status: 500 })
    }

    const postIds = (posts || []).map((post: any) => post.id)

    if (postIds.length === 0) {
      return NextResponse.json({
        totalLikes: 0,
        totalComments: 0,
        comments: [],
      })
    }

    const [likesResult, commentsResult] = await Promise.all([
      supabase
        .from('post_likes')
        .select('id, post_id')
        .in('post_id', postIds),
      supabase
        .from('post_comments')
        .select('id, content, created_at, post_id, users:user_id(full_name, email), posts:post_id(title)', { count: 'exact' })
        .in('post_id', postIds)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    const likesError = likesResult.error
    const commentsError = commentsResult.error

    if ((likesError && isMissingInteractionsTables(likesError)) || (commentsError && isMissingInteractionsTables(commentsError))) {
      return NextResponse.json({
        totalLikes: 0,
        totalComments: 0,
        comments: [],
        warning: 'interactions_tables_missing',
      })
    }

    if (likesError) {
      return NextResponse.json({ error: likesError.message }, { status: 500 })
    }

    if (commentsError) {
      return NextResponse.json({ error: commentsError.message }, { status: 500 })
    }

    const likesByPost: Record<string, number> = {}
    for (const row of likesResult.data || []) {
      likesByPost[row.post_id] = (likesByPost[row.post_id] || 0) + 1
    }

    const comments = (commentsResult.data || []).map((row: any) => {
      const author = Array.isArray(row.users) ? row.users[0] : row.users
      const post = Array.isArray(row.posts) ? row.posts[0] : row.posts

      return {
        id: row.id,
        content: row.content,
        created_at: row.created_at,
        post_id: row.post_id,
        post_title: post?.title || 'Post',
        author_name: author?.full_name || author?.email || 'Fan',
      }
    })

    return NextResponse.json({
      totalLikes: (likesResult.data || []).length,
      totalComments: commentsResult.count || comments.length,
      likesByPost,
      comments,
    })
  } catch (error: any) {
    console.error('Error in GET /api/creator/feedback:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
