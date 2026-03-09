import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()

  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const filePath = `${user.id}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('posts')
    .upload(filePath, file)

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data } = supabase.storage
    .from('posts')
    .getPublicUrl(filePath)

  return NextResponse.json({ url: data.publicUrl })
}
