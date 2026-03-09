import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { buildBackendHeaders } from '@/app/api/_lib/backend-auth'

function isMissingMessagesTableError(error: any): boolean {
    const message = String(error?.message || error || '')
    return /public\.messages/i.test(message) || /Could not find the table/i.test(message)
}

type ContactEntry = {
    id: string
    name: string
    role: string
    last_message?: string | null
    last_message_at?: string | null
    unread_count?: number
}

export async function GET() {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const backendBaseUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL
        let baseContacts: ContactEntry[] = []

        if (backendBaseUrl) {
            try {
                const headers = await buildBackendHeaders(supabase)
                if (!headers.Authorization) {
                    // No backend auth token available, continue with Supabase fallback
                } else {
                    const backendResponse = await fetch(`${backendBaseUrl}/messages/contacts`, {
                        method: 'GET',
                        cache: 'no-store',
                        headers,
                    })

                    if (backendResponse.ok) {
                        const backendData = await backendResponse.json()
                        const rows = Array.isArray(backendData)
                            ? backendData
                            : Array.isArray(backendData?.contacts)
                                ? backendData.contacts
                                : []

                        const contacts = rows
                            .map((entry: any) => {
                                const contactUser = entry?.user || entry
                                if (!contactUser?.id) return null

                                return {
                                    id: contactUser.id,
                                    name: contactUser.fullName || contactUser.full_name || contactUser.email,
                                    role: contactUser.creatorProfile ? 'creator' : 'fan',
                                }
                            })
                            .filter(Boolean)

                        baseContacts = contacts
                    }

                    if (backendResponse.status !== 401 && backendResponse.status !== 403) {
                        console.warn('Backend contacts GET returned non-OK, using Supabase fallback:', backendResponse.status)
                    }
                }

            } catch (backendError) {
                console.warn('Backend contacts GET failed, using Supabase fallback:', backendError)
            }
        }

        // Get user role to determine who to show
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = userData?.role || 'fan'
        const contactsMap = new Map<string, ContactEntry>()

        baseContacts.forEach((contact) => {
            if (!contact?.id) return
            contactsMap.set(contact.id, contact)
        })

        if (role === 'creator') {
            // Creator sees subscribers
            const { data: subs } = await supabase
                .from('subscriptions')
                .select(`
          fan_id,
          users:fan_id (
            id,
            full_name,
            email
          )
        `)
                .eq('creator_id', user.id)
                .eq('status', 'active')

            ;(subs || []).forEach((sub: any) => {
                const target = Array.isArray(sub.users) ? sub.users[0] : sub.users
                if (!target?.id) return

                contactsMap.set(target.id, {
                    id: target.id,
                    name: target.full_name || target.email,
                    role: 'fan',
                })
            })
        } else {
            // Fan sees creators they follow
            const { data: subs } = await supabase
                .from('subscriptions')
                .select(`
          creator_id,
          users:creator_id (
            id,
            full_name,
            email
          )
        `)
                .eq('fan_id', user.id)
                .eq('status', 'active')

            ;(subs || []).forEach((sub: any) => {
                const target = Array.isArray(sub.users) ? sub.users[0] : sub.users
                if (!target?.id) return

                contactsMap.set(target.id, {
                    id: target.id,
                    name: target.full_name || target.email,
                    role: 'creator',
                })
            })
        }

        let messagesTableMissing = false

        // Also include existing conversation contacts, even without active subscription
        const [{ data: sentRows, error: sentError }, { data: receivedRows, error: receivedError }] = await Promise.all([
            supabase.from('messages').select('receiver_id').eq('sender_id', user.id),
            supabase.from('messages').select('sender_id').eq('receiver_id', user.id),
        ])

        if (sentError && !isMissingMessagesTableError(sentError)) {
            throw sentError
        }

        if (receivedError && !isMissingMessagesTableError(receivedError)) {
            throw receivedError
        }

        if (sentError || receivedError) {
            messagesTableMissing = true
        }

        const messageContactIds = new Set<string>([
            ...((sentRows || []).map((row: any) => row.receiver_id).filter(Boolean)),
            ...((receivedRows || []).map((row: any) => row.sender_id).filter(Boolean)),
        ])

        const missingIds = Array.from(messageContactIds).filter((id) => !contactsMap.has(id) && id !== user.id)

        if (missingIds.length > 0) {
            const { data: usersRows } = await supabase
                .from('users')
                .select('id, full_name, email, role')
                .in('id', missingIds)

            ;(usersRows || []).forEach((entry: any) => {
                if (!entry?.id) return

                contactsMap.set(entry.id, {
                    id: entry.id,
                    name: entry.full_name || entry.email,
                    role: entry.role || 'user',
                })
            })
        }

        const contacts = Array.from(contactsMap.values())
        const contactIds = contacts.map((contact) => contact.id)

        if (contactIds.length > 0 && !messagesTableMissing) {
            const idsList = contactIds.join(',')
            const { data: messages, error: messagesError } = await supabase
                .from('messages')
                .select('id, sender_id, receiver_id, content, created_at, is_read')
                .or(`and(sender_id.eq.${user.id},receiver_id.in.(${idsList})),and(sender_id.in.(${idsList}),receiver_id.eq.${user.id})`)
                .order('created_at', { ascending: false })
                .limit(500)

            if (messagesError) {
                if (isMissingMessagesTableError(messagesError)) {
                    messagesTableMissing = true
                } else {
                    throw messagesError
                }
            }

            const lastMessageByContact: Record<string, { content: string; created_at: string }> = {}
            const unreadByContact: Record<string, number> = {}

            for (const message of messages || []) {
                const otherId = message.sender_id === user.id ? message.receiver_id : message.sender_id
                if (!otherId) continue

                if (!lastMessageByContact[otherId]) {
                    lastMessageByContact[otherId] = {
                        content: message.content,
                        created_at: message.created_at,
                    }
                }

                if (message.receiver_id === user.id && !message.is_read) {
                    unreadByContact[otherId] = (unreadByContact[otherId] || 0) + 1
                }
            }

            contacts.forEach((contact) => {
                const lastMessage = lastMessageByContact[contact.id]
                contact.last_message = lastMessage?.content || null
                contact.last_message_at = lastMessage?.created_at || null
                contact.unread_count = unreadByContact[contact.id] || 0
            })
        }

        contacts.sort((a, b) => {
            const aTime = a.last_message_at ? Date.parse(a.last_message_at) : 0
            const bTime = b.last_message_at ? Date.parse(b.last_message_at) : 0
            return bTime - aTime
        })

        if (messagesTableMissing) {
            return NextResponse.json({ contacts, warning: 'messages_table_missing' })
        }

        return NextResponse.json({ contacts })
    } catch (error: any) {
        console.error('Error in GET /api/messages/contacts:', error)
        if (isMissingMessagesTableError(error)) {
            return NextResponse.json({ contacts: [], warning: 'messages_table_missing' })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
