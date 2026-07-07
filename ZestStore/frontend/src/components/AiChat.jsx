import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, X, Send, Trash2, ChevronLeft } from 'lucide-react'
import { getConversations, getMessages, sendMessage, deleteConversation } from '../api/ai'

export default function AiChat() {
  const [open, setOpen] = useState(false)
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('list')
  const bottomRef = useRef(null)

  const loadConvs = useCallback(async () => {
    try { setConversations(await getConversations()) } catch {}
  }, [])

  const loadMessages = useCallback(async (id) => {
    try {
      const msgs = await getMessages(id)
      setMessages(msgs)
      setActiveConv(id)
      setView('chat')
    } catch {}
  }, [])

  useEffect(() => { if (open) loadConvs() }, [open, loadConvs])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return
    const userText = input
    setInput('')
    setLoading(true)
    setMessages((prev) => [...prev, { nguoiGui: 'user', noiDung: userText, maTinNhan: Date.now() }])
    try {
      const result = await sendMessage(userText, activeConv)
      setMessages((prev) => [...prev, { nguoiGui: 'ai', noiDung: result.reply, maTinNhan: Date.now() + 1 }])
      if (!activeConv) setActiveConv(result.maHoiThoai)
      loadConvs()
    } catch {} finally { setLoading(false) }
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }

  const handleDelete = async (id) => {
    try {
      await deleteConversation(id)
      if (activeConv === id) { setActiveConv(null); setMessages([]); setView('list') }
      loadConvs()
    } catch {}
  }

  const handleNew = () => { setActiveConv(null); setMessages([]); setView('chat') }

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-blue-700 text-white p-4 rounded-full shadow-xl hover:bg-blue-800 transition-all hover:scale-110">
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden">
          <div className="flex items-center justify-between bg-blue-700 text-white px-4 py-3">
            <div className="flex items-center gap-2">
              {view === 'chat' && (
                <button onClick={() => { setView('list'); setActiveConv(null) }} className="hover:bg-blue-600 p-1 rounded">
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">Trợ lý ZestStore</span>
            </div>
            <button onClick={() => setOpen(false)} className="hover:bg-blue-600 p-1 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50">
            {view === 'list' ? (
              <div className="p-3 space-y-2">
                <button onClick={handleNew}
                  className="w-full text-left bg-blue-50 text-blue-700 rounded-xl px-4 py-3 text-sm font-semibold border-2 border-dashed border-blue-200 hover:bg-blue-100 transition">
                  + Hội thoại mới
                </button>
                {conversations.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-10">Chưa có hội thoại nào</p>
                )}
                {conversations.map((c) => (
                  <div key={c.maHoiThoai}
                    className="flex items-center justify-between bg-white rounded-xl border px-4 py-3 hover:border-blue-300 cursor-pointer transition"
                    onClick={() => loadMessages(c.maHoiThoai)}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.tieuDe}</p>
                      <p className="text-xs text-gray-400">{new Date(c.ngayTao).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(c.maHoiThoai) }}
                      className="text-gray-300 hover:text-red-500 p-1 shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-10">
                    <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">Hỏi tôi bất cứ điều gì về sản phẩm!</p>
                    <p className="text-gray-400 text-xs mt-1">Ví dụ: Áo polo size L có không?</p>
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.maTinNhan} className={`flex ${m.nguoiGui === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.nguoiGui === 'user'
                        ? 'bg-blue-700 text-white rounded-br-md'
                        : 'bg-white border text-gray-700 rounded-bl-md'
                    }`}>
                      {m.noiDung}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-gray-500">
                      <span className="animate-pulse">Đang suy nghĩ...</span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {view === 'chat' && (
            <div className="border-t bg-white px-4 py-3 flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn..." disabled={loading}
                className="flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" />
              <button onClick={handleSend} disabled={loading || !input.trim()}
                className="bg-blue-700 text-white p-2.5 rounded-xl hover:bg-blue-800 transition disabled:opacity-50">
                <Send className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
