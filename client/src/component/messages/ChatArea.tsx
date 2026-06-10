"use client"

import React from 'react'
import { Check } from 'lucide-react'
import type { MessageRecord } from '@/lib/api'

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

interface Props {
  messages: MessageRecord[]
  loading: boolean
  chatError: string
  selectedContact: { friend: { firstName: string; lastName: string } } | null
  currentUserId: string
  messageRefs: React.MutableRefObject<Map<string, HTMLElement>>
  chatEndRef: React.RefObject<HTMLDivElement | null>
}

export const ChatArea = ({ messages, loading, chatError, selectedContact, currentUserId, messageRefs, chatEndRef }: Props) => {
  if (loading) {
    return <div className="text-[#65676b]">Loading conversation…</div>
  }

  if (chatError) {
    return (
      <div className="rounded-3xl bg-red-50 dark:bg-[#3a1f1f] p-6 text-red-700">
        {chatError}
      </div>
    )
  }

  if (!selectedContact) {
    return <div className="text-[#65676b]">Select a chat on the left to view messages.</div>
  }

  if (messages.length === 0) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-[#242526] border border-[#ced0d4] dark:border-[#3e4042] text-center text-[#65676b]">
        Start the conversation by sending a message.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => {
        const mine = message.sender.id === currentUserId
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
  )
}
