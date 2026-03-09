import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { buildBackendHeaders } from '@/app/api/_lib/backend-auth'

function mapBackendPostToFrontendShape(rawPost: any) {
  return {
    id: rawPost.id,
    title: rawPost.title,
    content: rawPost.content,
    image_url: rawPost.imageUrl ?? rawPost.image_url ?? null,
    video_url: rawPost.videoUrl ?? rawPost.video_url ?? null,
    created_at: rawPost.createdAt ?? rawPost.created_at,
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const backendBaseUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL

    if (backendBaseUrl) {
      try {
        const backendResponse = await fetch(`${backendBaseUrl}/posts/creator/${user.id}`, {
          method: 'GET',
          cache: 'no-store',
          headers: await buildBackendHeaders(supabase),
        })

        if (backendResponse.ok) {
          const backendData = await backendResponse.json()
          const rawPosts = Array.isArray(backendData)
            ? backendData
            : Array.isArray(backendData?.posts)
              ? backendData.posts
              : []

          return NextResponse.json({
            posts: rawPosts.map(mapBackendPostToFrontendShape),
          })
        }

        console.warn('Backend posts GET returned non-OK, using Supabase fallback:', backendResponse.status)
      } catch (backendError) {
        console.warn('Backend posts GET failed, using Supabase fallback:', backendError)
      }
    }

    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching posts:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ posts })
  } catch (error: any) {
    console.error('Error in GET /api/posts:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, image_url, video_url } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const backendBaseUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL

    if (backendBaseUrl) {
      try {
        const backendResponse = await fetch(`${backendBaseUrl}/posts`, {
          method: 'POST',
          headers: await buildBackendHeaders(supabase),
          body: JSON.stringify({
            title,
            content,
            imageUrl: image_url || null,
            videoUrl: video_url || null,
          }),
        })

        if (backendResponse.ok) {
          const backendPost = await backendResponse.json()
          return NextResponse.json({ post: mapBackendPostToFrontendShape(backendPost) })
        }

        console.warn('Backend posts POST returned non-OK, using Supabase fallback:', backendResponse.status)
      } catch (backendError) {
        console.warn('Backend posts POST failed, using Supabase fallback:', backendError)
      }
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        creator_id: user.id,
        title,
        content,
        image_url: image_url || null,
        video_url: video_url || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating post:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post })
  } catch (error: any) {
    console.error('Error in POST /api/posts:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 })
    }

    // Check if user owns the post
    const { data: post } = await supabase
      .from('posts')
      .select('creator_id')
      .eq('id', id)
      .single()

    if (!post || post.creator_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this post' }, { status: 403 })
    }

    const backendBaseUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL

    if (backendBaseUrl) {
      try {
        const backendResponse = await fetch(`${backendBaseUrl}/posts/${id}`, {
          method: 'DELETE',
          headers: await buildBackendHeaders(supabase),
        })

        if (backendResponse.ok) {
          return NextResponse.json({ success: true })
        }

        console.warn('Backend posts DELETE returned non-OK, using Supabase fallback:', backendResponse.status)
      } catch (backendError) {
        console.warn('Backend posts DELETE failed, using Supabase fallback:', backendError)
      }
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting post:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/posts:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

