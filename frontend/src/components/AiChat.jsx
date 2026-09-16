import { useState } from 'react'
import AiChatPanel, { RobotHead } from './AiChatPanel'

export default function AiChat() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 hover:scale-110 transition-transform duration-200 cursor-pointer">
          <RobotHead size="sm" />
        </button>
      )}
      <div className={`fixed inset-0 sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[600px] sm:w-[400px] z-50 sm:rounded-2xl sm:shadow-2xl overflow-hidden animate-fade-in ${open ? '' : 'hidden'}`}>
        <AiChatPanel open={open} onClose={() => setOpen(false)} />
      </div>
    </>
  )
}
