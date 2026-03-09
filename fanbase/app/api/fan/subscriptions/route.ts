import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { buildBackendHeaders } from '@/app/api/_lib/backend-auth'

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
                const backendResponse = await fetch(`${backendBaseUrl}/subscriptions/my-subscriptions`, {
                    method: 'GET',
                    cache: 'no-store',
                    headers: await buildBackendHeaders(supabase),
                })

                if (backendResponse.ok) {
                    const backendData = await backendResponse.json()
                    const rows = Array.isArray(backendData)
                        ? backendData
                        : Array.isArray(backendData?.subscriptions)
                            ? backendData.subscriptions
                            : []

                    const formattedSubs = rows.map((sub: any) => {
                        const creator = sub.creator || {}
                        const profile = creator.creatorProfile || creator.creators_profile || {}

                        return {
                            id: sub.id,
                            creator: {
                                id: creator.id,
                                name: creator.fullName || creator.full_name || creator.email,
                                email: creator.email,
                                bio: profile.bio || '',
                                price_fcfa: profile.priceFcfa ?? profile.price_fcfa ?? 500,
                                category: profile.category || null,
                            },
                            status: sub.status || 'active',
                            created_at: sub.createdAt ?? sub.created_at,
                        }
                    })

                    return NextResponse.json({ subscriptions: formattedSubs })
                }

                console.warn('Backend fan subscriptions returned non-OK, using Supabase fallback:', backendResponse.status)
            } catch (backendError) {
                console.warn('Backend fan subscriptions failed, using Supabase fallback:', backendError)
            }
        }

        const { data: subscriptions, error } = await supabase
            .from('subscriptions')
            .select(`
        *,
        creator:creator_id (
          id,
          full_name,
          email,
          creators_profile (
            bio,
            price_fcfa,
            category
          )
        )
      `)
            .eq('fan_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })

        if (error) throw error

        // Transform data structure
        const formattedSubs = subscriptions.map((sub: any) => ({
            id: sub.id, // subscription id
            creator: {
                id: sub.creator.id,
                name: sub.creator.full_name || sub.creator.email,
                email: sub.creator.email,
                bio: sub.creator.creators_profile?.[0]?.bio || sub.creator.creators_profile?.bio || '',
                price_fcfa: sub.creator.creators_profile?.[0]?.price_fcfa || sub.creator.creators_profile?.price_fcfa || 500,
                category: sub.creator.creators_profile?.[0]?.category || sub.creator.creators_profile?.category || null,
            },
            status: sub.status,
            created_at: sub.created_at,
        }))

        return NextResponse.json({ subscriptions: formattedSubs })
    } catch (error: any) {
        console.error('Error in GET /api/fan/subscriptions:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
