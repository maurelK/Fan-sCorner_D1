import { requireAdmin } from '@/app/api/_lib/require-admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin()
    if ('error' in auth) {
      return auth.error
    }

    const { supabase } = auth
    const { searchParams } = new URL(request.url)

    const role = searchParams.get('role') || 'all'
    const status = searchParams.get('status') || 'all'
    const search = (searchParams.get('search') || '').trim()

    let query = supabase
      .from('users')
      .select('id, email, full_name, role, status, created_at')
      .order('created_at', { ascending: false })
      .limit(300)

    if (role !== 'all') {
      query = query.eq('role', role)
    }

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    const users = (data || []).map((user: any) => ({
      id: user.id,
      email: user.email,
      name: user.full_name || user.email,
      role: user.role,
      status: user.status || 'active',
      created_at: user.created_at,
    }))

    return NextResponse.json({ users })
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
    const { userId, status, role } = body || {}

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const payload: Record<string, string> = {}

    if (typeof status === 'string' && status.length > 0) {
      payload.status = status
    }

    if (typeof role === 'string' && ['fan', 'creator', 'admin'].includes(role)) {
      payload.role = role
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', userId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}