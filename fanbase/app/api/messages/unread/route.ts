import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

function isMissingMessagesTableError(error: any): boolean {
  const message = String(error?.message || error || '')
  return /public\.messages/i.test(message) || /Could not find the table/i.test(message)
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false)

    if (error) {
      if (isMissingMessagesTableError(error)) {
        return NextResponse.json({ unread: 0, warning: 'messages_table_missing' })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ unread: count || 0 })
  } catch (error: any) {
    if (isMissingMessagesTableError(error)) {
      return NextResponse.json({ unread: 0, warning: 'messages_table_missing' })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
