import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

function mapBackendCreatorToFrontendShape(rawCreator: any) {
  const profile = rawCreator?.creatorProfile || {}

  return {
    id: rawCreator.id,
    name: rawCreator.fullName || rawCreator.name || rawCreator.email?.split('@')?.[0] || 'Creator',
    email: rawCreator.email,
    bio: profile.bio || rawCreator.bio || '',
    category: profile.category || rawCreator.category || null,
    price_fcfa: profile.priceFcfa ?? rawCreator.priceFcfa ?? rawCreator.price_fcfa ?? 500,
    profile_image_url: profile.profileImageUrl ?? rawCreator.profileImageUrl ?? rawCreator.profile_image_url ?? null,
    cover_image_url: profile.coverImageUrl ?? rawCreator.coverImageUrl ?? rawCreator.cover_image_url ?? null,
  }
}

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

async function loadCreatorFromSupabase(creatorId: string) {
  const supabase = await createClient()

  const { data: creator, error: creatorError } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      email,
      role,
      creators_profile (
        bio,
        category,
        price_fcfa,
        profile_image_url,
        cover_image_url
      )
    `)
    .eq('id', creatorId)
    .eq('role', 'creator')
    .single()

  if (creatorError || !creator) {
    throw new Error('Créateur non trouvé')
  }

  const { count: subscribersCount } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', creatorId)
    .eq('status', 'active')

  const { data: posts } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      content,
      image_url,
      video_url,
      created_at
    `)
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })

  const profile = Array.isArray((creator as any).creators_profile)
    ? (creator as any).creators_profile[0]
    : (creator as any).creators_profile

  return {
    creator: {
      id: creator.id,
      name: creator.full_name || creator.email.split('@')[0],
      email: creator.email,
      bio: profile?.bio || '',
      category: profile?.category || null,
      price_fcfa: profile?.price_fcfa || 500,
      subscribers: subscribersCount || 0,
      profile_image_url: profile?.profile_image_url || null,
      cover_image_url: profile?.cover_image_url || null,
    },
    posts: posts || [],
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: creatorId } = await params

    const backendBaseUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL
    let creatorDataFromSource: any = null
    let postsFromSource: any[] = []

    if (backendBaseUrl) {
      try {
        const [creatorResponse, postsResponse] = await Promise.all([
          fetch(`${backendBaseUrl}/creators/${creatorId}`, { cache: 'no-store' }),
          fetch(`${backendBaseUrl}/posts/creator/${creatorId}`, { cache: 'no-store' }),
        ])

        if (creatorResponse.ok) {
          const backendCreator = await creatorResponse.json()
          creatorDataFromSource = mapBackendCreatorToFrontendShape(backendCreator)
        }

        if (postsResponse.ok) {
          const backendPosts = await postsResponse.json()
          const normalizedPosts = Array.isArray(backendPosts)
            ? backendPosts
            : Array.isArray(backendPosts?.posts)
              ? backendPosts.posts
              : []
          postsFromSource = normalizedPosts.map(mapBackendPostToFrontendShape)
        }

        if (!creatorDataFromSource) {
          console.warn('Backend creator endpoint failed or empty, using Supabase fallback')
        }
      } catch (backendError) {
        console.warn('Backend creator detail request failed, using Supabase fallback:', backendError)
      }
    }

    if (!creatorDataFromSource) {
      const fallbackData = await loadCreatorFromSupabase(creatorId)
      creatorDataFromSource = fallbackData.creator
      postsFromSource = fallbackData.posts
    }

    const { count: subscribersCount } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', creatorId)
      .eq('status', 'active')

    // Vérifier si l'utilisateur actuel est abonné
    const { data: { user } } = await supabase.auth.getUser()
    let isSubscribed = false

    if (user) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('fan_id', user.id)
        .eq('creator_id', creatorId)
        .eq('status', 'active')
        .maybeSingle()

      if (subscription) {
        isSubscribed = true
      }
    }

    // Ajouter is_locked aux posts si l'utilisateur n'est pas abonné
    const postsWithLock = (postsFromSource || []).map(post => ({
      ...post,
      is_locked: !isSubscribed
    }))

    const creatorData = {
      ...creatorDataFromSource,
      subscribers: subscribersCount || 0,
      is_subscribed: isSubscribed,
    }

    return NextResponse.json({ 
      creator: creatorData, 
      posts: postsWithLock 
    })

  } catch (error: any) {
    console.error('❌ Erreur API créateur:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur', 
      details: error.message 
    }, { status: 500 })
  }
}