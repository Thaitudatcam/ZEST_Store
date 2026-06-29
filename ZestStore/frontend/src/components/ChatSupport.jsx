import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, LogIn, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getMessages, sendMessage, markRead, deleteMessage } from '../api/chat'
import { useNavigate } from 'react-router-dom'

export default function ChatSupport() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [hoveredId, setHoveredId] = useState(null)
  const msgEndRef = useRef(null)

  useEffect(() => {
    if (open && user) {
      setLoading(true)
      Promise.all([getMessages(), markRead()])
        .then(([data]) => {
          setMessages(data.length > 0 ? data : [{
            id: 0, maTinNhan: 0, noiDung: 'Chào bạn! ZEST Store hỗ trợ gì cho bạn ạ?', vaiTro: 'ADMIN', ngayTao: null
          }])
        })
        .catch(() => setMessages([{
          id: 0, maTinNhan: 0, noiDung: 'Chào bạn! ZEST Store hỗ trợ gì cho bạn ạ?', vaiTro: 'ADMIN', ngayTao: null
        }]))
        .finally(() => setLoading(false))
    }
  }, [open, user])

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    const tempId = Date.now()
    setMessages(prev => [...prev, {
      maTinNhan: tempId, noiDung: text, vaiTro: 'USER', ngayTao: new Date().toISOString()
    }])
    setInput('')
    try {
      const saved = await sendMessage(text)
      setMessages(prev => prev.map(m => m.maTinNhan === tempId ? saved : m))
    } catch {}
  }

  const handleDelete = async (maTinNhan) => {
    try {
      await deleteMessage(maTinNhan)
      setMessages(prev => prev.map(m => m.maTinNhan === maTinNhan ? { ...m, daXoa: true } : m))
    } catch {}
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl border w-80 sm:w-96 flex flex-col overflow-hidden animate-fade-in-up">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">Hỗ trợ khách hàng</p>
                <p className="text-[10px] text-blue-100">ZEST Store</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-72 min-h-[200px] bg-gray-50">
            {!user ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                <MessageCircle className="h-10 w-10" />
                <p className="text-sm">Vui lòng đăng nhập để chat</p>
                <button onClick={() => navigate('/login')}
                  className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition">
                  <LogIn className="h-4 w-4" /> Đăng nhập
                </button>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              messages.map(m => (
                <div key={m.maTinNhan || m.id}
                  onMouseEnter={() => setHoveredId(m.maTinNhan)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`flex items-center gap-1.5 ${m.vaiTro === 'USER' ? 'justify-end' : 'justify-start'}`}>
                  {m.vaiTro === 'USER' && !m.daXoa && hoveredId === m.maTinNhan && (
                    <button onClick={() => handleDelete(m.maTinNhan)}
                      className="p-1 text-gray-400 hover:text-red-500 transition shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                    m.daXoa ? 'bg-gray-100 text-gray-400 italic' :
                    m.vaiTro === 'USER'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white text-gray-700 border rounded-bl-md shadow-sm'
                  }`}>
                    {m.daXoa ? 'Tin nhắn đã bị xoá' : m.noiDung}
                  </div>
                </div>
              ))
            )}
            <div ref={msgEndRef} />
          </div>
          {user && (
            <div className="border-t p-3 flex items-center gap-2 bg-white">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Nhập tin nhắn..." autoFocus
                className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={handleSend} disabled={!input.trim()}
                className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
        <button onClick={() => setOpen(!open)}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
            open ? 'bg-gray-700 rotate-90 scale-90' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:scale-105 animate-pulse-subtle'
          }`}>
          {open ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-6 w-6 text-white" />}
        </button>
      </div>
  )
}
