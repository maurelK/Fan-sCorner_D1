import { requireAdmin } from '@/app/api/_lib/require-admin'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const auth = await requireAdmin()
        if ('error' in auth) {
            return auth.error
        }
        const { supabase } = auth

        // Total Users
        const { count: totalUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })

        // Total Creators
        const { count: totalCreators } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'creator')

        // Total Revenue (Mock calculation from Mock Payments)
        // Since we don't have proper aggregation in JS without fetching all, we'll fetch all payments.
        // In real app, write RPC or use summation.
        const { data: payments } = await supabase
            .from('payments')
            .select('amount')

        const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0

        return NextResponse.json({
            stats: {
                totalUsers: totalUsers || 0,
                totalCreators: totalCreators || 0,
                totalRevenue
            }
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
