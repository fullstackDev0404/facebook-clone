"use client"

import React from 'react'

interface Props {
  messageText: string
  onMessageTextChange: (value: string) => void
  onSend: () => void
  disabled: boolean
  sending: boolean
  error: string
  placeholder: string
}

export const MessageInput = ({ messageText, onMessageTextChange, onSend, disabled, sending, error, placeholder }: Props) => {
  return (
    <>
      <div className="px-5 py-4 border-t border-[#f0f2f5] dark:border-[#3e4042] bg-white dark:bg-[#242526]">
        <div className="flex items-center gap-3">
          <input
            value={messageText}
            onChange={(event) => onMessageTextChange(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && !event.shiftKey && (event.preventDefault(), onSend())}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 px-4 py-3 rounded-3xl border border-[#ced0d4] dark:border-[#3e4042] bg-[#f7f8f9] dark:bg-[#18191a] text-[14px] text-[#050505] focus:border-[#1877f2] focus:outline-none"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={disabled || sending || !messageText.trim()}
            className="px-4 py-3 rounded-3xl bg-[#1877f2] text-white font-semibold disabled:opacity-60"
          >
            Send
          </button>
        </div>
        {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}
      </div>
    </>
  )
}
