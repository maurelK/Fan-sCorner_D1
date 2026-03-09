import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

function isMissingMessagesTableError(error: any): boolean {
  const message = String(error?.message || error || '')
  return /public\.messages/i.test(message) || /Could not find the table/i.test(message)
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const senderId = body?.sender_id

    if (!senderId) {
      return NextResponse.json({ error: 'Missing sender_id' }, { status: 400 })
    }

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', user.id)
      .eq('sender_id', senderId)
      .eq('is_read', false)

    if (error) {
      if (isMissingMessagesTableError(error)) {
        return NextResponse.json({ ok: false, warning: 'messages_table_missing' }, { status: 503 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (isMissingMessagesTableError(error)) {
      return NextResponse.json({ ok: false, warning: 'messages_table_missing' }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
