import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function requireAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: NextResponse.json({ error: 'Non autorisé' }, { status: 401 }),
    }
  }

  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || userProfile?.role !== 'admin') {
    return {
      error: NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      ),
    }
  }

  return { supabase, user }
}