"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Header from '@/component/Header'
import LeftSidebar from '@/component/LeftSidebar'
import RightSidebar from '@/component/RightSidebar'
import ProtectedRoute from '@/component/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import { friendsApi, messagesApi, notificationsApi, type FriendEntry, type MessageRecord } from '@/lib/api'
import { connectSocket, disconnectSocket } from '@/lib/socket'
import { useViewport, calcGutter } from '@/hooks/useViewport'
import { BREAKPOINTS } from '@/lib/constants'
import { avatarSrc } from '@/component/feed/feedUtils'
import { Check } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

const MessagesPage = () => {
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const [contacts, setContacts] = useState<FriendEntry[]>([])
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [socketConnected, setSocketConnected] = useState(false)
  const [error, setError] = useState('')
  const [chatError, setChatError] = useState('')
  const [typingUser, setTypingUser] = useState<{ senderId: string; senderName: string; senderAvatar: string | null } | null>(null)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const selectedContactRef = useRef<string | null>(null)
  const socketRef = useRef<any>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messageRefs = useRef<Map<string, HTMLElement>>(new Map())
  const observerRef = useRef<IntersectionObserver | null>(null)

  const vw = useViewport()
  const showLeft = vw >= BREAKPOINTS.MOBILE
  const showRight = vw >= BREAKPOINTS.TABLET
  const gutter = calcGutter(vw)

  const selectedContact = useMemo(
    () => contacts.find((item) => item.friend.id === selectedContactId) ?? contacts[0] ?? null,
    [contacts, selectedContactId]
  )

  useEffect(() => {
    selectedContactRef.current = selectedContact?.friend.id ?? null
  }, [selectedContact])

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const data = await friendsApi.getFriends()
        setContacts(data.friends)
        if (data.friends.length) {
          setSelectedContactId((prev) => prev ?? data.friends[0].friend.id)
        }
      } catch {
        setError('Unable to load chats.')
      }
    }

    loadContacts()
  }, [])

  useEffect(() => {
    if (!selectedContact) {
      setMessages([])
      setLoading(false)
      setTypingUser(null)
      return
    }

    setLoading(true)
    setChatError('')
    setTypingUser(null)
    messagesApi.getChatHistory(selectedContact.friend.id)
      .then((data) => {
        setMessages(data.conversation.messages)
        // Mark messages as read when chat is opened via socket for real-time updates
        const socket = socketRef.current
        if (socket && socket.connected) {
          socket.emit('mark_messages_read', { senderId: selectedContact.friend.id }, (response: { success: boolean; error?: string }) => {
            if (!response?.success) {
              // Fallback to REST API if socket fails
              messagesApi.markAsRead(selectedContact.friend.id).catch(() => {})
            }
          })
        } else {
          // Fallback to REST API if socket not connected
          messagesApi.markAsRead(selectedContact.friend.id).catch(() => {})
        }
      })
      .catch(() => setChatError('Unable to load conversation.'))
      .finally(() => setLoading(false))
  }, [selectedContact])

  useEffect(() => {
    if (!user) return

    // Mark all message notifications as read when messages page is opened
    notificationsApi.getAll({ page: 1, limit: 100, unreadOnly: true })
      .then((d: any) => {
        const messageNotifications = d.notifications.filter((n: any) => n.type === 'message')
        if (messageNotifications.length > 0) {
          notificationsApi.markAllRead().catch(() => {})
        }
      })
      .catch(() => {})

    const socket = connectSocket()
    socketRef.current = socket

    if (!socket) {
      setSocketConnected(false)
      return
    }

    const handleConnect = () => setSocketConnected(true)
    const handleDisconnect = () => setSocketConnected(false)
    const handleMessage = (payload: { message: MessageRecord }) => {
      const currentContactId = selectedContactRef.current
      if (!currentContactId) return
      const incoming = payload.message
      if (incoming.sender.id !== currentContactId && incoming.receiver.id !== currentContactId) return
      setMessages((prev) => (prev.some((item) => item.id === incoming.id) ? prev : [...prev, incoming]))
      
      // If the message is from the other user and chat is open, mark it as read if visible
      if (incoming.sender.id === currentContactId && incoming.receiver.id === user.id && !incoming.read) {
        // Use setTimeout to ensure the message is rendered before checking visibility
        setTimeout(() => {
          const messageElement = messageRefs.current.get(incoming.id)
          if (messageElement) {
            const isVisible = isElementInViewport(messageElement)
            if (isVisible) {
              const socket = socketRef.current
              if (socket && socket.connected) {
                socket.emit('mark_messages_read', { senderId: currentContactId }, (response: { success: boolean }) => {
                  if (response?.success) {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === incoming.id ? { ...msg, read: true } : msg
                      )
                    )
                  }
                })
              }
            }
          }
        }, 100)
      }
    }
    const handleUserTyping = (payload: { senderId: string; senderName: string; senderAvatar: string | null }) => {
      const currentContactId = selectedContactRef.current
      if (!currentContactId || payload.senderId !== currentContactId) return
      setTypingUser(payload)
    }
    const handleUserStopTyping = (payload: { senderId: string }) => {
      const currentContactId = selectedContactRef.current
      if (!currentContactId || payload.senderId !== currentContactId) return
      setTypingUser(null)
    }
    const handleMessageSeen = (payload: { senderId: string; receiverId: string; count: number }) => {
      const currentContactId = selectedContactRef.current
      if (!currentContactId) return
      // Update messages as read when the other user has seen them
      // payload.senderId is the person who sent the message (current user)
      // payload.receiverId is the person who read the message (current contact)
      if (payload.senderId === user.id && payload.receiverId === currentContactId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender.id === user.id && msg.receiver.id === currentContactId && !msg.read
              ? { ...msg, read: true }
              : msg
          )
        )
      }
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('message:new', handleMessage)
    socket.on('user:typing', handleUserTyping)
    socket.on('user:stop_typing', handleUserStopTyping)
    socket.on('message:seen', handleMessageSeen)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('message:new', handleMessage)
      socket.off('user:typing', handleUserTyping)
      socket.off('user:stop_typing', handleUserStopTyping)
      socket.off('message:seen', handleMessageSeen)
      disconnectSocket()
      messageRefs.current.clear()
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [user])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Helper function to check if element is in viewport
  const isElementInViewport = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    )
  }

  // Emit typing events when user types
  useEffect(() => {
    if (!selectedContact || !socketRef.current?.connected) return

    if (messageText.trim()) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Emit typing event
      socketRef.current.emit('typing', { receiverId: selectedContact.friend.id })

      // Set timeout to emit stop_typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('stop_typing', { receiverId: selectedContact.friend.id })
      }, 3000)
    } else {
      // Emit stop_typing if input is cleared
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      socketRef.current?.emit('stop_typing', { receiverId: selectedContact.friend.id })
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [messageText, selectedContact])

  const handleSend = async () => {
    if (!selectedContact) return
    const content = messageText.trim()
    if (!content) return

    setSending(true)
    setError('')

    // Emit stop_typing when sending a message
    socketRef.current?.emit('stop_typing', { receiverId: selectedContact.friend.id })

    try {
      const socket = socketRef.current
      if (socket && socket.connected) {
        socket.emit('send_message', { receiverId: selectedContact.friend.id, content }, (response: { success: boolean; error?: string }) => {
          setSending(false)
          if (!response?.success) {
            const errorMessage = response?.error || 'Unable to send message'
            setError(errorMessage)
            showError(errorMessage)
          } else {
            setMessageText('')
          }
        })
      } else {
        const response = await messagesApi.send(selectedContact.friend.id, content)
        setMessages((prev) => [...prev, response.message])
        setMessageText('')
        setSending(false)
      }
    } catch (err) {
      const errorMessage = 'Unable to send message. Please try again.'
      setError(errorMessage)
      showError(errorMessage)
      setSending(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-[#f0f2f5] dark:bg-[#18191a]">
        <Header />

        <div className="flex pt-14 w-full min-h-[calc(100vh-56px)]">
          {showLeft && (
            <div className="w-60 shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
              <LeftSidebar />
            </div>
          )}

          <main className="flex-1 min-w-0 py-5 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto h-[calc(100vh-56px-40px)]">
              <div className="rounded-3xl bg-white dark:bg-[#242526] border border-[#ced0d4] dark:border-[#3e4042] shadow-sm overflow-hidden h-full">
                <div className="flex flex-col md:flex-row md:items-stretch h-full">
                  <div className="md:w-80 border-b border-[#f0f2f5] dark:border-[#3e4042] md:border-b-0 md:border-r flex flex-col">
                    <div className="px-5 py-5 border-b border-[#f0f2f5] dark:border-[#3e4042] shrink-0">
                      <h2 className="text-[18px] font-semibold text-[#050505]">Chats</h2>
                      <p className="text-[13px] text-[#65676b] mt-1">Select a friend to start chatting.</p>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {contacts.length === 0 ? (
                        <div className="p-6 text-center text-[#65676b]">
                          No friends found. Add friends to start conversations.
                        </div>
                      ) : (
                        <div className="space-y-1 p-3">
                          {contacts.map((contact) => {
                            const active = contact.friend.id === selectedContact?.friend.id
                            return (
                              <button
                                key={contact.friend.id}
                                onClick={() => setSelectedContactId(contact.friend.id)}
                                className={`flex items-center gap-3 w-full text-left rounded-3xl px-3 py-3 transition-colors ${active ? 'bg-[#e7f3ff] text-[#050505]' : 'hover:bg-[#f0f2f5] dark:hover:bg-[#242526]'}`}
                              >
                                <div className="w-11 h-11 rounded-full overflow-hidden bg-[#e4e6eb] shrink-0">
                                  {contact.friend.avatar ? (
                                    <img src={avatarSrc(contact.friend.avatar)} alt="Avatar" className="object-cover w-full h-full" />
                                  ) : (
                                    <div className="flex items-center justify-center w-full h-full bg-[#1877f2] text-white font-semibold">
                                      {contact.friend.firstName[0]}{contact.friend.lastName[0]}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-[15px] text-[#050505] truncate">{contact.friend.firstName} {contact.friend.lastName}</p>
                                  <p className="text-[13px] text-[#65676b] truncate">
                                    {contact.lastMessage 
                                      ? (contact.lastMessage.senderId === user.id ? 'You: ' : '') + contact.lastMessage.content
                                      : (contact.since ? `Friends since ${new Date(contact.since).toLocaleDateString()}` : 'Friend')
                                    }
                                  </p>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="px-5 py-5 border-b border-[#f0f2f5] dark:border-[#3e4042] flex items-center justify-between shrink-0">
                      <div>
                        <p className="text-[18px] font-semibold text-[#050505]">{selectedContact ? `${selectedContact.friend.firstName} ${selectedContact.friend.lastName}` : 'No chat selected'}</p>
                        <p className="text-[13px] text-[#65676b]">
                          {typingUser ? `${typingUser.senderName} is typing...` : (socketConnected ? 'Live chat connected' : 'Connecting…')}
                        </p>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-5 py-4 bg-[#f7f8f9] dark:bg-[#18191a]">
                      {loading ? (
                        <div className="text-[#65676b]">Loading conversation…</div>
                      ) : chatError ? (
                        <div className="rounded-3xl bg-red-50 dark:bg-[#3a1f1f] p-6 text-red-700">{chatError}</div>
                      ) : selectedContact ? (
                        <div className="space-y-3">
                          {messages.length === 0 ? (
                            <div className="p-8 rounded-3xl bg-white dark:bg-[#242526] border border-[#ced0d4] dark:border-[#3e4042] text-center text-[#65676b]">
                              Start the conversation by sending a message.
                            </div>
                          ) : messages.map((message) => {
                            const mine = message.sender.id === user.id
                            return (
                              <div 
                                key={message.id} 
                                ref={(el) => {
                                  if (el) messageRefs.current.set(message.id, el)
                                  else messageRefs.current.delete(message.id)
                                }}
                                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`max-w-[80%] rounded-3xl px-4 py-3 shadow-sm ${mine ? 'bg-[#1877f2] text-white' : 'bg-white dark:bg-[#242526] text-[#050505]'}`}>
                                  <p className="text-[14px] leading-6 whitespace-pre-wrap">{message.content}</p>
                                  <div className={`mt-2 flex items-center gap-1 ${mine ? 'justify-end' : 'justify-start'}`}>
                                    <p className={`text-[11px] ${mine ? 'text-[#dbe9ff]' : 'text-[#6b7280]'}`}>{formatTime(message.createdAt)}</p>
                                    {mine && (
                                      <span className="flex items-center relative">
                                        <Check size={14} className="text-[#dbe9ff]" />
                                        {message.read && <Check size={14} className="text-[#dbe9ff] -ml-2.5" />}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                          <div ref={chatEndRef} />
                        </div>
                      ) : (
                        <div className="text-[#65676b]">Select a chat on the left to view messages.</div>
                      )}
                    </div>

                    <div className="px-5 py-4 border-t border-[#f0f2f5] dark:border-[#3e4042] bg-white dark:bg-[#242526]">
                      <div className="flex items-center gap-3">
                        <input
                          value={messageText}
                          onChange={(event) => setMessageText(event.target.value)}
                          onKeyDown={(event) => event.key === 'Enter' && !event.shiftKey && (event.preventDefault(), handleSend())}
                          placeholder={selectedContact ? 'Write a message...' : 'Select a chat first.'}
                          disabled={!selectedContact}
                          className="flex-1 px-4 py-3 rounded-3xl border border-[#ced0d4] dark:border-[#3e4042] bg-[#f7f8f9] dark:bg-[#18191a] text-[14px] text-[#050505] focus:border-[#1877f2] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleSend}
                          disabled={!selectedContact || sending || !messageText.trim()}
                          className="px-4 py-3 rounded-3xl bg-[#1877f2] text-white font-semibold disabled:opacity-60"
                        >
                          Send
                        </button>
                      </div>
                      {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {showRight && <RightSidebar />}
          <div aria-hidden="true" style={{ width: gutter, flexShrink: 0, minWidth: 0, transition: 'width 60ms linear' }} />
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default MessagesPage
