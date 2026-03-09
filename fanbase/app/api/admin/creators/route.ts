import { requireAdmin } from '@/app/api/_lib/require-admin'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const auth = await requireAdmin()
        if ('error' in auth) {
            return auth.error
        }
        const { supabase } = auth

        const { data: creators } = await supabase
            .from('users')
            .select('id, full_name, email, role, created_at, status') // need to add status to schema
            .eq('role', 'creator')
            .order('created_at', { ascending: false })

        const formattedCreators = creators?.map((c: any) => ({
            id: c.id,
            name: c.full_name || c.email,
            email: c.email,
            status: c.status || 'active',
            joined_at: c.created_at
        })) || []

        return NextResponse.json({ creators: formattedCreators })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const auth = await requireAdmin()
        if ('error' in auth) {
            return auth.error
        }
        const { supabase } = auth
        const body = await request.json()
        const { userId, status } = body

        const { error } = await supabase
            .from('users')
            .update({ status })
            .eq('id', userId)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
