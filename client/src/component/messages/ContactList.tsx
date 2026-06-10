"use client"

import React from 'react'
import { avatarSrc } from '@/component/feed/feedUtils'
import type { FriendEntry } from '@/lib/api'

interface Props {
  contacts: FriendEntry[]
  selectedContactId: string | null
  onSelectContact: (id: string) => void
  currentUserId: string
}

export const ContactList = ({ contacts, selectedContactId, onSelectContact, currentUserId }: Props) => {
  if (contacts.length === 0) {
    return (
      <div className="p-6 text-center text-[#65676b]">
        No friends found. Add friends to start conversations.
      </div>
    )
  }

  return (
    <div className="space-y-1 p-3">
      {contacts.map((contact) => {
        const active = contact.friend.id === selectedContactId
        return (
          <button
            key={contact.friend.id}
            onClick={() => onSelectContact(contact.friend.id)}
            className={`flex items-center gap-3 w-full text-left rounded-3xl px-3 py-3 transition-colors ${active ? 'bg-[#e7f3ff] text-[#050505]' : 'hover:bg-[#f0f2f5] dark:hover:bg-[#242526]'}`}
          >
            <div className="w-11 h-11 rounded-full overflow-hidden bg-[#e4e6eb] shrink-0">
              {contact.friend.avatar ? (
                <img src={avatarSrc(contact.friend.avatar)} alt="Avatar" className="object-cover w-full h-full" loading="lazy" />
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
                  ? (contact.lastMessage.senderId === currentUserId ? 'You: ' : '') + contact.lastMessage.content
                  : (contact.since ? `Friends since ${new Date(contact.since).toLocaleDateString()}` : 'Friend')
                }
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
