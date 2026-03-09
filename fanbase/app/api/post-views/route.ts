import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

function isMissingPostViewsTableError(error: any): boolean {
  const message = String(error?.message || error || '')
  return /public\.post_views/i.test(message) || /Could not find the table/i.test(message)
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userProfile?.role !== 'fan') {
      return NextResponse.json({ success: true, tracked: 0, ignored: true })
    }

    const body = await request.json().catch(() => ({}))
    const incomingPostIds = Array.isArray(body?.postIds)
      ? body.postIds
      : body?.postId
        ? [body.postId]
        : []

    const postIds = Array.from(
      new Set(
        incomingPostIds
          .filter((id: unknown) => typeof id === 'string')
          .map((id: string) => id.trim())
          .filter((id: string) => id.length > 0)
      )
    ).slice(0, 50)

    if (postIds.length === 0) {
      return NextResponse.json({ error: 'postIds is required' }, { status: 400 })
    }

    const rows = postIds.map((postId) => ({
      post_id: postId,
      user_id: user.id,
    }))

    const { error } = await supabase
      .from('post_views')
      .insert(rows)

    if (error) {
      if (isMissingPostViewsTableError(error)) {
        return NextResponse.json(
          {
            error: "La table post_views n'est pas encore créée",
            code: 'post_views_table_missing',
          },
          { status: 503 }
        )
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, tracked: rows.length })
  } catch (error: any) {
    if (isMissingPostViewsTableError(error)) {
      return NextResponse.json(
        {
          error: "La table post_views n'est pas encore créée",
          code: 'post_views_table_missing',
        },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}