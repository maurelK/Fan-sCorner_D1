import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { buildBackendHeaders } from '@/app/api/_lib/backend-auth'

function isMissingMessagesTableError(error: any): boolean {
    const message = String(error?.message || error || '')
    return /public\.messages/i.test(message) || /Could not find the table/i.test(message)
}

function mapBackendMessageToFrontendShape(message: any) {
    return {
        id: message.id,
        sender_id: message.senderId ?? message.sender_id,
        receiver_id: message.receiverId ?? message.receiver_id,
        content: message.content,
        created_at: message.createdAt ?? message.created_at,
        is_read: message.isRead ?? message.is_read ?? false,
    }
}

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const otherUserId = searchParams.get('userId')

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!otherUserId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
        }

        const backendBaseUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL

        if (backendBaseUrl) {
            try {
                const headers = await buildBackendHeaders(supabase)
                if (headers.Authorization) {
                    const backendResponse = await fetch(`${backendBaseUrl}/messages/conversation/${otherUserId}`, {
                        method: 'GET',
                        cache: 'no-store',
                        headers,
                    })

                    if (backendResponse.ok) {
                        const backendData = await backendResponse.json()
                        const rows = Array.isArray(backendData)
                            ? backendData
                            : Array.isArray(backendData?.messages)
                                ? backendData.messages
                                : []

                        return NextResponse.json({
                            messages: rows.map(mapBackendMessageToFrontendShape),
                        })
                    }

                    if (backendResponse.status !== 401 && backendResponse.status !== 403) {
                        console.warn('Backend messages GET returned non-OK, using Supabase fallback:', backendResponse.status)
                    }
                }
            } catch (backendError) {
                console.warn('Backend messages GET failed, using Supabase fallback:', backendError)
            }
        }

        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true })

        if (error) {
            if (isMissingMessagesTableError(error)) {
                return NextResponse.json({ messages: [], warning: 'messages_table_missing' })
            }
            throw error
        }

        return NextResponse.json({ messages })
    } catch (error: any) {
        console.error('Error in GET /api/messages:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { receiver_id, content } = body
        const trimmedContent = String(content || '').trim()

        if (!receiver_id || !trimmedContent) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        if (receiver_id === user.id) {
            return NextResponse.json({ error: 'Cannot send message to yourself' }, { status: 400 })
        }

        const { data: receiver, error: receiverError } = await supabase
            .from('users')
            .select('id')
            .eq('id', receiver_id)
            .maybeSingle()

        if (receiverError || !receiver) {
            return NextResponse.json({ error: 'Receiver not found' }, { status: 404 })
        }

        const backendBaseUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL

        if (backendBaseUrl) {
            try {
                const headers = await buildBackendHeaders(supabase)
                if (headers.Authorization) {
                    const backendResponse = await fetch(`${backendBaseUrl}/messages`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            receiverId: receiver_id,
                            content: trimmedContent,
                        }),
                    })

                    if (backendResponse.ok) {
                        const backendMessage = await backendResponse.json()
                        return NextResponse.json({ message: mapBackendMessageToFrontendShape(backendMessage) })
                    }

                    if (backendResponse.status !== 401 && backendResponse.status !== 403) {
                        console.warn('Backend messages POST returned non-OK, using Supabase fallback:', backendResponse.status)
                    }
                }
            } catch (backendError) {
                console.warn('Backend messages POST failed, using Supabase fallback:', backendError)
            }
        }

        const { data: message, error } = await supabase
            .from('messages')
            .insert({
                sender_id: user.id,
                receiver_id,
                content: trimmedContent,
            })
            .select()
            .single()

        if (error) {
            if (isMissingMessagesTableError(error)) {
                return NextResponse.json(
                    {
                        error: "La table de messagerie n'est pas encore créée sur Supabase",
                        code: 'messages_table_missing',
                    },
                    { status: 503 }
                )
            }
            throw error
        }

        return NextResponse.json({ message })
    } catch (error: any) {
        console.error('Error in POST /api/messages:', error)
        if (isMissingMessagesTableError(error)) {
            return NextResponse.json(
                {
                    error: "La table de messagerie n'est pas encore créée sur Supabase",
                    code: 'messages_table_missing',
                },
                { status: 503 }
            )
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
