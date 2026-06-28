import { useState, useEffect, useRef } from 'react'
import { getConversations, getAdminMessages, adminReply, deleteMessage } from '../../api/chat'
import { getCustomers } from '../../api/admin'
import { MessageCircle, Send, ChevronRight, Trash2 } from 'lucide-react'

export default function AdminChat() {
  const [conversations, setConversations] = useState([])
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [hoveredId, setHoveredId] = useState(null)
  const msgEndRef = useRef(null)

  const loadConversations = () => {
    Promise.all([
      getConversations(),
      getCustomers().catch(() => [])
    ]).then(([userIds, allUsers]) => {
      setConversations(userIds)
      setUsers(Array.isArray(allUsers) ? allUsers : [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadConversations() }, [])

  useEffect(() => {
    if (selectedUserId) {
      getAdminMessages(selectedUserId).then(setMessages).catch(() => {})
    }
  }, [selectedUserId])

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !selectedUserId) return
    setSending(true)
    const tempId = Date.now()
    setMessages(prev => [...prev, {
      maTinNhan: tempId, noiDung: text, vaiTro: 'ADMIN', ngayTao: new Date().toISOString()
    }])
    setInput('')
    try {
      const saved = await adminReply(selectedUserId, text)
      setMessages(prev => [...prev.map(m => m.maTinNhan === tempId ? saved : m)])
      // reload after send to get fresh data
      getAdminMessages(selectedUserId).then(setMessages).catch(() => {})
    } catch {} finally { setSending(false) }
  }

  const handleDelete = async (maTinNhan) => {
    try {
      await deleteMessage(maTinNhan)
      setMessages(prev => prev.map(m => m.maTinNhan === maTinNhan ? { ...m, daXoa: true } : m))
    } catch {}
  }

  const getUserName = (id) => {
    const u = users.find(x => x.maNguoiDung === id)
    return u?.hoTen || `#${id}`
  }

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 bg-gray-200 rounded-lg" />
      <div className="h-96 bg-gray-100 rounded-2xl" />
    </div>
  )

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="w-72 border-r flex flex-col shrink-0">
        <div className="p-4 border-b">
          <h2 className="font-bold text-base flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            Hỗ trợ khách hàng
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">{conversations.length} cuộc hội thoại</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">Chưa có tin nhắn nào</div>
          ) : (
            conversations.map(userId => (
                <button key={userId} onClick={() => setSelectedUserId(userId)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm border-b hover:bg-gray-50 transition ${
                    selectedUserId === userId ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
                  }`}>
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {getUserName(userId).charAt(0)}
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="font-semibold text-gray-800 truncate">{getUserName(userId)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                </button>
              )))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {!selectedUserId ? (
          <div className="flex-1 flex items-center justify-center text-gray-300">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-3" />
              <p className="text-sm">Chọn một cuộc hội thoại để xem tin nhắn</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-xs">
                {getUserName(selectedUserId).charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-800">{getUserName(selectedUserId)}</p>
                <p className="text-xs text-gray-400">Khách hàng</p>
              </div>
            </div>
            <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-gray-50">
              {messages.map(m => (
                <div key={m.maTinNhan}
                  onMouseEnter={() => setHoveredId(m.maTinNhan)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`flex items-center gap-1.5 ${m.vaiTro === 'ADMIN' ? 'justify-end' : 'justify-start'}`}>
                  {m.vaiTro === 'ADMIN' && !m.daXoa && hoveredId === m.maTinNhan && (
                    <button onClick={() => handleDelete(m.maTinNhan)}
                      className="p-1 text-gray-400 hover:text-red-500 transition shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <div className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                    m.daXoa ? 'bg-gray-100 text-gray-400 italic' :
                    m.vaiTro === 'ADMIN'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white text-gray-700 border rounded-bl-md shadow-sm'
                  }`}>
                    {m.daXoa ? 'Tin nhắn đã bị xoá' : m.noiDung}
                  </div>
                </div>
              ))}
              <div ref={msgEndRef} />
            </div>
            <div className="border-t p-3 flex items-center gap-2 bg-white">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !sending && handleSend()}
                placeholder="Nhập phản hồi..." autoFocus
                className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={handleSend} disabled={!input.trim() || sending}
                className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition">
                {sending ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
