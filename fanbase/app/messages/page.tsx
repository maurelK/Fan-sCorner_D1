'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { Send, User, ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface Contact {
    id: string;
    name: string;
    role: string;
    last_message?: string | null;
    last_message_at?: string | null;
    unread_count?: number;
}

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
}

function MessagesContent() {
    const searchParams = useSearchParams();
    const userIdParam = searchParams.get('userId');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const shouldAutoScrollRef = useRef(true);
    const isFirstLoadRef = useRef(true);

    useEffect(() => {
        loadContacts();
        fetch('/api/auth/me').then(res => res.json()).then(data => setCurrentUserId(data.user?.id));
    }, []);

    useEffect(() => {
        if (userIdParam && contacts.length > 0) {
            const targetContact = contacts.find(c => c.id === userIdParam);
            if (targetContact) {
                setSelectedContact(targetContact);
                setIsMobileChatOpen(true);
            }
        }
    }, [userIdParam, contacts]);

    useEffect(() => {
        if (selectedContact) {
            loadMessages(selectedContact.id);
        }
    }, [selectedContact]);

    useEffect(() => {
        if (!selectedContact) return;

        const intervalId = setInterval(() => {
            loadMessages(selectedContact.id);
        }, 3000);

        return () => clearInterval(intervalId);
    }, [selectedContact]);

    useEffect(() => {
        if (!messagesContainerRef.current) return;

        if (isFirstLoadRef.current) {
            isFirstLoadRef.current = false;
            scrollToBottom('auto');
            return;
        }

        if (shouldAutoScrollRef.current) {
            scrollToBottom('smooth');
        }
    }, [messages]);

    const scrollToBottom = (_behavior: ScrollBehavior) => {
        const container = messagesContainerRef.current;
        if (!container) return;
        container.scrollTop = container.scrollHeight;
    };

    const handleMessagesScroll = () => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        shouldAutoScrollRef.current = distanceFromBottom < 120;
    };

    const loadContacts = async () => {
        try {
            const response = await fetch('/api/messages/contacts');
            if (response.ok) {
                const data = await response.json();
                setContacts(data.contacts || []);
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    const markConversationRead = async (senderId: string) => {
        try {
            await fetch('/api/messages/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sender_id: senderId }),
            });
        } catch {
            // Best-effort only
        }
    };

    const loadMessages = async (userId: string) => {
        try {
            const response = await fetch(`/api/messages?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                setMessages(data.messages || []);
                await markConversationRead(userId);
                await loadContacts();
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedContact || sending) return;

        setSendError(null);
        setSending(true);

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiver_id: selectedContact.id,
                    content: newMessage.trim(),
                }),
            });

            if (response.ok) {
                await response.json();
                setNewMessage('');
                await loadMessages(selectedContact.id);
                await loadContacts();
            } else {
                const data = await response.json().catch(() => ({}));
                setSendError(data.error || 'Impossible d\'envoyer le message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setSendError('Erreur réseau pendant l\'envoi');
        } finally {
            setSending(false);
        }
    };

    const handleSelectContact = (contact: Contact) => {
        setSelectedContact(contact);
        setIsMobileChatOpen(true);
    };

    if (loading) {
        return (
            <div className="bg-[#faf8f5] min-h-screen py-12 flex items-center justify-center">
                <div className="text-[#2d1b4e]">Chargement...</div>
            </div>
        );
    }

    return (
        <div className="bg-[#faf8f5] min-h-screen py-6 sm:py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-[calc(100dvh-8rem)] sm:h-[calc(100vh-8rem)]">
                <h1 className="text-3xl font-bold text-[#2d1b4e] mb-6">Messagerie</h1>

                <div className="bg-white rounded-2xl shadow-lg border border-orange-100 flex flex-col md:flex-row h-[calc(100dvh-12rem)] sm:h-[calc(100vh-12rem)] overflow-hidden">
                    {/* Contacts Sidebar */}
                    <div className={`${isMobileChatOpen ? 'hidden' : 'flex'} md:flex md:w-1/3 md:border-r border-orange-100 flex-col h-full`}>
                        <div className="p-4 border-b border-orange-100 bg-orange-50/50">
                            <h2 className="font-semibold text-[#2d1b4e]">Conversations</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
                            {contacts.length === 0 ? (
                                <div className="p-4 text-center text-[#2d1b4e]/60 text-sm">
                                    Aucun contact disponible.<br />Abonnez-vous à un créateur ou attendez des abonnés.
                                </div>
                            ) : (
                                contacts.map((contact) => (
                                    <button
                                        key={contact.id}
                                        onClick={() => handleSelectContact(contact)}
                                        className={`w-full min-h-[64px] box-border p-4 flex items-center gap-3 hover:bg-orange-50 transition-colors text-left ${selectedContact?.id === contact.id ? 'bg-orange-50 border-r-4 border-[#ff6b35]' : ''
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-[#ff6b35]/20 flex items-center justify-center text-[#ff6b35] font-bold shrink-0">
                                            {contact.name[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="font-medium text-[#2d1b4e] truncate">{contact.name}</h3>
                                                <span className="text-[10px] text-[#2d1b4e]/50 min-w-[40px] text-right">
                                                    {contact.last_message_at
                                                        ? new Date(contact.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                        : ''}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-xs text-[#2d1b4e]/60 capitalize truncate">
                                                    {contact.last_message || contact.role}
                                                </p>
                                                <span
                                                    className={`min-w-[24px] text-center bg-[#ff6b35] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                        contact.unread_count && contact.unread_count > 0 ? '' : 'opacity-0'
                                                    }`}
                                                >
                                                    {contact.unread_count || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className={`${isMobileChatOpen ? 'flex' : 'hidden'} md:flex flex-1 flex-col h-full`}>
                        {selectedContact ? (
                            <>
                                {/* Header */}
                                <div className="p-4 border-b border-orange-100 flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsMobileChatOpen(false)}
                                        className="md:hidden w-9 h-9 rounded-full border border-orange-200 flex items-center justify-center text-[#2d1b4e]"
                                        aria-label="Retour aux conversations"
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                    <div className="w-10 h-10 rounded-full bg-[#ff6b35]/20 flex items-center justify-center text-[#ff6b35] font-bold">
                                        {selectedContact.name[0].toUpperCase()}
                                    </div>
                                    <h3 className="font-bold text-[#2d1b4e]">{selectedContact.name}</h3>
                                </div>

                                {/* Messages */}
                                <div
                                    ref={messagesContainerRef}
                                    onScroll={handleMessagesScroll}
                                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#faf8f5]"
                                    style={{ scrollbarGutter: 'stable' }}
                                >
                                    {sendError && (
                                        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 text-sm">
                                            {sendError}
                                        </div>
                                    )}
                                    {messages.map((msg) => {
                                        const isMe = msg.sender_id === currentUserId;
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[82%] md:max-w-[70%] rounded-2xl p-3 px-4 md:px-5 shadow-sm ${isMe
                                                            ? 'bg-[#ff6b35] text-white rounded-br-none'
                                                            : 'bg-white text-[#2d1b4e] rounded-bl-none border border-orange-100'
                                                        }`}
                                                >
                                                    <p>{msg.content}</p>
                                                    <p className={`text-[10px] mt-1 ${isMe ? 'text-white/70' : 'text-[#2d1b4e]/40'}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <form onSubmit={handleSendMessage} className="p-4 border-t border-orange-100 bg-white">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Écrivez votre message..."
                                            className="flex-1 px-4 py-3 border border-orange-200 rounded-full focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent text-[#2d1b4e] bg-[#faf8f5]"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim() || sending}
                                            className="w-12 h-12 shrink-0 rounded-full bg-[#ff6b35] text-white flex items-center justify-center hover:bg-[#e55a2b] transition-colors disabled:opacity-50"
                                        >
                                            <Send size={20} />
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-[#2d1b4e]/40 bg-[#faf8f5]">
                                <User size={64} className="mb-4 opacity-50" />
                                <p className="text-lg">Sélectionnez une conversation</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={
            <div className="bg-[#faf8f5] min-h-screen flex items-center justify-center">
                <div className="text-[#2d1b4e]">Chargement...</div>
            </div>
        }>
            <MessagesContent />
        </Suspense>
    );
}
