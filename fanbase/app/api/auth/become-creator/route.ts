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
        const { bio, price, category } = body

        if (!price || !category) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Update User Role
        const { error: userError } = await supabase
            .from('users')
            .update({ role: 'creator' })
            .eq('id', user.id)

        if (userError) {
            return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
        }

        // 2. Create Creator Profile
        const { error: profileError } = await supabase
            .from('creators_profile')
            .insert({
                user_id: user.id,
                bio: bio || '',
                price_fcfa: parseInt(price),
                category,
            })

        if (profileError) {
            console.error('Profile creation error:', profileError)
            // Attempt to rollback role (optional but good practice)
            await supabase.from('users').update({ role: 'fan' }).eq('id', user.id)
            return NextResponse.json({ error: 'Failed to create creator profile' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error in become-creator:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
