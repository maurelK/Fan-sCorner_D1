import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { bio, price_fcfa, category, profile_image_url, cover_image_url } = body

        const payload = {
            user_id: user.id,
            bio: bio ?? '',
            price_fcfa: Number.parseInt(String(price_fcfa), 10) || 500,
            category: category ?? null,
            profile_image_url: profile_image_url ?? null,
            cover_image_url: cover_image_url ?? null,
            updated_at: new Date().toISOString(),
        }

        // Upsert in creators_profile table (create row if it does not exist yet)
        const { data, error } = await supabase
            .from('creators_profile')
            .upsert(payload, { onConflict: 'user_id' })
            .select('*')
            .single()

        if (error) {
            console.error('Error updating profile:', error)
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
        }

        return NextResponse.json({ success: true, profile: data })
    } catch (error: any) {
        console.error('Error in POST /api/creator/profile:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
