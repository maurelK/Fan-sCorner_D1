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
        const [creatorResponse, statsResponse] = await Promise.all([
          fetch(`${backendBaseUrl}/creators/${user.id}`, {
            method: 'GET',
            cache: 'no-store',
          }),
          fetch(`${backendBaseUrl}/creators/my-stats`, {
            method: 'GET',
            cache: 'no-store',
            headers: await buildBackendHeaders(supabase),
          }),
        ])

        if (creatorResponse.ok) {
          const creatorData = await creatorResponse.json()
          const profile = creatorData?.creatorProfile || {}

          let subscribers = creatorData?.subscribersCount || 0
          let subscriptions: any[] = []

          if (statsResponse.ok) {
            const myStats = await statsResponse.json()
            subscribers = myStats?.subscribersCount ?? subscribers
            subscriptions = Array.isArray(myStats?.activeSubscribers)
              ? myStats.activeSubscribers.map((sub: any) => ({
                  id: sub.id,
                  created_at: sub.createdAt ?? sub.created_at,
                  fan_id: sub.fanId ?? sub.fan_id,
                  users: {
                    full_name: sub.fan?.fullName ?? sub.fan?.full_name ?? null,
                    email: sub.fan?.email ?? null,
                  },
                }))
              : []
          }

          const pricePerMonth = profile?.priceFcfa ?? profile?.price_fcfa ?? 500
          const revenue = subscribers * pricePerMonth

          return NextResponse.json({
            subscribers,
            revenue,
            pricePerMonth,
            subscriptions,
          })
        }

        console.warn('Backend stats endpoints returned non-OK, using Supabase fallback')
      } catch (backendError) {
        console.warn('Backend stats request failed, using Supabase fallback:', backendError)
      }
    }

    // Get active subscriptions count
    const { count: subscribersCount, error: subscribersError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', user.id)
      .eq('status', 'active')

    if (subscribersError) {
      console.error('Error fetching subscribers:', subscribersError)
      return NextResponse.json({ error: subscribersError.message }, { status: 500 })
    }

    // Get total revenue (sum of subscription prices)
    // First, get the creator's price from creators_profile
    const { data: creatorProfile, error: profileError } = await supabase
      .from('creators_profile')
      .select('price_fcfa')
      .eq('user_id', user.id)
      .single()

    // If no profile exists, use default price
    const pricePerMonth = creatorProfile?.price_fcfa || 500
    const totalRevenue = (subscribersCount || 0) * pricePerMonth

    // Get active subscriptions for the list
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        created_at,
        fan_id,
        users!subscriptions_fan_id_fkey(full_name, email)
      `)
      .eq('creator_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10)

    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError)
    }

    return NextResponse.json({
      subscribers: subscribersCount || 0,
      revenue: totalRevenue,
      pricePerMonth,
      subscriptions: subscriptions || []
    })
  } catch (error: any) {
    console.error('Error in GET /api/stats:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

