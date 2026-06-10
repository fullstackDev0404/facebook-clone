"use client"

import React from 'react'

interface Props {
  selectedContact: { friend: { firstName: string; lastName: string } } | null
  typingUser: { senderName: string } | null
  socketConnected: boolean
}

export const ChatHeader = ({ selectedContact, typingUser, socketConnected }: Props) => {
  return (
    <div className="px-5 py-5 border-b border-[#f0f2f5] dark:border-[#3e4042] flex items-center justify-between shrink-0">
      <div>
        <p className="text-[18px] font-semibold text-[#050505]">
          {selectedContact ? `${selectedContact.friend.firstName} ${selectedContact.friend.lastName}` : 'No chat selected'}
        </p>
        <p className="text-[13px] text-[#65676b]">
          {typingUser ? `${typingUser.senderName} is typing...` : (socketConnected ? 'Live chat connected' : 'Connecting…')}
        </p>
      </div>
    </div>
  )
}
