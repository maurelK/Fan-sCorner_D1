import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

function mapBackendCreatorToFrontendShape(creator: any) {
  return {
    id: creator.id,
    name: creator.name,
    email: creator.email,
    bio: creator.bio || '',
    category: creator.category || null,
    price_fcfa: creator.priceFcfa ?? creator.price_fcfa ?? 500,
    subscribers: creator.subscribersCount ?? creator.subscribers ?? 0,
    profile_image_url: creator.profileImageUrl ?? creator.profile_image_url ?? null,
    cover_image_url: creator.coverImageUrl ?? creator.cover_image_url ?? null,
  }
}

async function loadCreatorsFromSupabase() {
  const supabase = await createClient()

  const { data: creators, error } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      email,
      creators_profile (
        bio,
        category,
        price_fcfa,
        profile_image_url,
        cover_image_url
      )
    `)
    .eq('role', 'creator')

  if (error) {
    throw new Error(error.message)
  }

  const creatorsWithStats = await Promise.all(
    (creators || []).map(async (creator: any) => {
      const { count } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creator.id)
        .eq('status', 'active')

      const profile = Array.isArray(creator.creators_profile)
        ? creator.creators_profile[0]
        : creator.creators_profile

      return {
        id: creator.id,
        name: creator.full_name || creator.email.split('@')[0],
        email: creator.email,
        bio: profile?.bio || '',
        category: profile?.category || null,
        price_fcfa: profile?.price_fcfa || 500,
        subscribers: count || 0,
        profile_image_url: profile?.profile_image_url || null,
        cover_image_url: profile?.cover_image_url || null,
      }
    })
  )

  return creatorsWithStats
}

export async function GET() {
  try {
    const backendBaseUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL

    if (backendBaseUrl) {
      try {
        const backendResponse = await fetch(`${backendBaseUrl}/creators`, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (backendResponse.ok) {
          const backendData = await backendResponse.json()
          const rawCreators = Array.isArray(backendData)
            ? backendData
            : Array.isArray(backendData?.creators)
              ? backendData.creators
              : []

          const creators = rawCreators.map(mapBackendCreatorToFrontendShape)
          return NextResponse.json({ creators })
        }

        console.warn('Backend /creators returned non-OK status, using Supabase fallback:', backendResponse.status)
      } catch (backendError) {
        console.warn('Backend /creators request failed, using Supabase fallback:', backendError)
      }
    }

    const creators = await loadCreatorsFromSupabase()
    return NextResponse.json({ creators })
  } catch (error: any) {
    console.error('Error in GET /api/creators:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

