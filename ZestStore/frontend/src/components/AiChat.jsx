import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, X, Send, Trash2, ChevronLeft, Image, Smile, Paperclip, Camera } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import { getConversations, getMessages, sendMessage, deleteConversation } from '../api/ai'
import { useNavigate } from 'react-router-dom'

export default function AiChat() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('list')
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showAttach, setShowAttach] = useState(false)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const attachRef = useRef(null)

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (attachRef.current && !attachRef.current.contains(e.target)) setShowAttach(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Ảnh không được quá 5MB'); return }
    const base64 = await readFileAsBase64(file)
    setSelectedImage(base64)
    setPreviewUrl(base64)
    setShowAttach(false)
    e.target.value = ''
  }

  const handleCameraCapture = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Ảnh không được quá 5MB'); return }
    const base64 = await readFileAsBase64(file)
    setSelectedImage(base64)
    setPreviewUrl(base64)
    setShowAttach(false)
    e.target.value = ''
  }

  const handlePaste = useCallback(async (e) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (!file) continue
        if (file.size > 5 * 1024 * 1024) { alert('Ảnh không được quá 5MB'); return }
        const base64 = await readFileAsBase64(file)
        setSelectedImage(base64)
        setPreviewUrl(base64)
        break
      }
    }
  }, [])

  const removeImage = () => {
    setSelectedImage(null)
    setPreviewUrl(null)
  }

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return
    const userText = input
    const imgData = selectedImage
    setInput('')
    setSelectedImage(null)
    setPreviewUrl(null)
    setShowEmoji(false)
    setShowAttach(false)
    setLoading(true)
    const tempId = Date.now()
    setMessages((prev) => [...prev, { nguoiGui: 'user', noiDung: userText, hinhAnh: imgData, maTinNhan: tempId }])
    try {
      const result = await sendMessage(userText, activeConv, imgData)
      setMessages((prev) => [...prev, { nguoiGui: 'ai', noiDung: result.reply, products: result.products || [], maTinNhan: tempId + 1 }])
      if (!activeConv) setActiveConv(result.maHoiThoai)
      loadConvs()
    } catch {} finally { setLoading(false) }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleDelete = async (id) => {
    try {
      await deleteConversation(id)
      if (activeConv === id) { setActiveConv(null); setMessages([]); setView('list') }
      loadConvs()
    } catch {}
  }

  const handleNew = () => { setActiveConv(null); setMessages([]); setView('chat') }

  const isSendDisabled = loading || (!input.trim() && !selectedImage)

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

          <div className="flex-1 overflow-y-auto bg-gray-50" onPaste={handlePaste}>
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
                  <div key={m.maTinNhan}>
                    <div className={`flex ${m.nguoiGui === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        m.nguoiGui === 'user'
                          ? 'bg-blue-700 text-white rounded-br-md'
                          : 'bg-white border text-gray-700 rounded-bl-md'
                      }`}>
                        {m.hinhAnh && (
                          <img src={m.hinhAnh} alt="upload"
                            className={`max-w-full rounded-lg ${m.noiDung ? 'mb-2' : ''}`}
                            style={{ maxHeight: '180px', objectFit: 'contain' }} />
                        )}
                        {m.noiDung && <p>{m.noiDung}</p>}
                      </div>
                    </div>
                    {m.products && m.products.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2 ml-1">
                        {m.products.map((p) => (
                          <div key={p.maSanPham} onClick={() => { navigate(`/products/${p.slug}`); setOpen(false) }}
                            className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2 cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all w-full">
                            <img src={p.urlAnhDaiDien ? (p.urlAnhDaiDien.startsWith('http') || p.urlAnhDaiDien.startsWith('/api/') ? p.urlAnhDaiDien : `/api/files/${p.urlAnhDaiDien}`) : ''}
                              alt={p.tenSanPham} className="w-12 h-12 rounded-lg object-cover shrink-0 bg-gray-100" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate">{p.tenSanPham}</p>
                              <p className="text-xs text-blue-700 font-semibold">{Number(p.gia || 0).toLocaleString('vi-VN')}đ</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
            <div className="border-t bg-white px-3 py-2.5">
              {showEmoji && (
                <div className="mb-2">
                  <EmojiPicker
                    onEmojiClick={(emojiData) => { setInput(prev => prev + emojiData.emoji); setShowEmoji(false) }}
                    skinTonesDisabled
                    searchPlaceholder="Tìm emoji..."
                    width="100%"
                    height="250px" />
                </div>
              )}
              {previewUrl && (
                <div className="relative mb-2 inline-block">
                  <img src={previewUrl} alt="preview"
                    className="h-16 w-16 rounded-lg object-cover border" />
                  <button onClick={removeImage}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="flex gap-1.5 items-center">
                <div className="relative" ref={attachRef}>
                  <button onClick={() => { setShowAttach(!showAttach); setShowEmoji(false) }} disabled={loading}
                    className="bg-gray-100 text-gray-500 p-2 rounded-xl hover:bg-gray-200 transition disabled:opacity-50">
                    <Paperclip className="h-5 w-5" />
                  </button>
                  {showAttach && (
                    <div className="absolute bottom-full left-0 mb-1 bg-white border rounded-xl shadow-lg p-1.5 flex gap-1">
                      <button onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">
                        <Image className="h-4 w-4" /> Ảnh
                      </button>
                      <button onClick={() => cameraInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">
                        <Camera className="h-4 w-4" /> Camera
                      </button>
                    </div>
                  )}
                </div>
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                  onFocus={() => setShowEmoji(false)}
                  placeholder="Nhập tin nhắn..." disabled={loading}
                  className="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" />
                <button onClick={() => { setShowEmoji(!showEmoji); setShowAttach(false) }} disabled={loading}
                  className={`p-2 rounded-xl transition disabled:opacity-50 ${showEmoji ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  <Smile className="h-5 w-5" />
                </button>
                <button onClick={handleSend} disabled={isSendDisabled}
                  className="bg-blue-700 text-white p-2 rounded-xl hover:bg-blue-800 transition disabled:opacity-50">
                  <Send className="h-5 w-5" />
                </button>
              </div>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
              <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleCameraCapture} className="hidden" />
            </div>
          )}
        </div>
      )}
    </>
  )
}
