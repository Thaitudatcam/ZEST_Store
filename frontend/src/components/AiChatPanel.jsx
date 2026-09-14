import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Send, Paperclip, Image, Camera, Trash2, Plus, MessageSquare, ArrowRight } from 'lucide-react'
import { getConversations, getMessages, sendMessage, deleteConversation } from '../api/ai'
import api from '../api/axios'

export function RobotHead({ size = 'sm', blink = false }) {
  const sizeMap = { sm: 'w-14 h-14', md: 'w-16 h-16' }
  const padMap = { sm: 'p-[10px]', md: 'p-[12px]' }
  return (
    <div className={`${sizeMap[size]} relative flex flex-col items-center justify-center`}>
      <div className="absolute -top-2.5 flex flex-col items-center">
        <div className="w-1 h-3 bg-gold rounded-full" />
        <div className="w-2 h-2 rounded-full bg-gold shadow-[0_0_6px_rgba(201,162,39,0.6)] animate-glow-pulse" />
      </div>
      <div className={`w-full h-full rounded-2xl bg-gradient-to-br from-gold to-gold-dark shadow-lg ring-[2px] ring-ivory/50 flex flex-col items-center justify-center relative overflow-hidden ${padMap[size]}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
        <div className="flex gap-2.5 items-center">
          <div className={`w-[7px] h-[7px] rounded-full bg-noir transition-transform duration-100 ${blink ? 'scale-y-[0.2]' : 'scale-y-100'}`} />
          <div className={`w-[7px] h-[7px] rounded-full bg-noir transition-transform duration-100 ${blink ? 'scale-y-[0.2]' : 'scale-y-100'}`} />
        </div>
        <div className="flex gap-[3px] mt-1">
          <div className="w-[3px] h-[3px] rounded-full bg-noir/40" />
          <div className="w-[3px] h-[3px] rounded-full bg-noir/60" />
          <div className="w-[3px] h-[3px] rounded-full bg-noir/40" />
        </div>
        <div className="absolute left-1.5 bottom-1.5 w-2.5 h-1.5 rounded-full bg-gradient-to-r from-bordeaux/20 to-transparent" />
        <div className="absolute right-1.5 bottom-1.5 w-2.5 h-1.5 rounded-full bg-gradient-to-l from-bordeaux/20 to-transparent" />
      </div>
    </div>
  )
}

export function useBlink() {
  const [blink, setBlink] = useState(false)
  useEffect(() => {
    let blinkTimer
    const scheduleBlink = () => {
      const delay = 4000 + Math.random() * 8000
      blinkTimer = setTimeout(() => {
        setBlink(true)
        setTimeout(() => setBlink(false), 150)
        scheduleBlink()
      }, delay)
    }
    scheduleBlink()
    return () => clearTimeout(blinkTimer)
  }, [])
  return blink
}

export default function AiChatPanel({ open, onClose, quickPrompts = [] }) {
  const navigate = useNavigate()
  const [showSidebar, setShowSidebar] = useState(false)
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [showAttach, setShowAttach] = useState(false)
  const blink = useBlink()
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const attachRef = useRef(null)

  const loadConvs = useCallback(async () => {
    try {
      const convs = await getConversations()
      setConversations(convs)
    } catch {}
  }, [])

  useEffect(() => {
    if (!open) return
    loadConvs()
  }, [open, loadConvs])

  useEffect(() => {
    if (!open) { setShowSidebar(false); return }
    const restore = async () => {
      try {
        const convs = await getConversations()
        setConversations(convs)
        if (messages.length > 0) return
        if (convs.length > 0 && !activeConv) {
          convs.sort((a, b) => new Date(b.ngayTao || 0) - new Date(a.ngayTao || 0))
          const msgs = await getMessages(convs[0].maHoiThoai)
          setActiveConv(convs[0].maHoiThoai)
          setMessages(Array.isArray(msgs) ? msgs : [])
        } else if (activeConv) {
          const msgs = await getMessages(activeConv)
          setMessages(Array.isArray(msgs) ? msgs : [])
        }
      } catch {}
    }
    restore()
  }, [open])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (attachRef.current && !attachRef.current.contains(e.target)) setShowAttach(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
    setSelectedImage(await readFileAsBase64(file))
    setShowAttach(false)
    e.target.value = ''
  }

  const handleCameraCapture = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Ảnh không được quá 5MB'); return }
    setSelectedImage(await readFileAsBase64(file))
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
        if (!file || file.size > 5 * 1024 * 1024) { alert('Ảnh không được quá 5MB'); return }
        setSelectedImage(await readFileAsBase64(file))
        break
      }
    }
  }, [])

  const switchConv = async (id) => {
    setActiveConv(id)
    setShowSidebar(false)
    setMessages([])
    try {
      const msgs = await getMessages(id)
      setMessages(Array.isArray(msgs) ? msgs : [])
    } catch {}
  }

  const startNewConv = () => {
    setActiveConv(null)
    setMessages([])
    setShowSidebar(false)
  }

  const handleDeleteConv = async (id, e) => {
    e.stopPropagation()
    await deleteConversation(id).catch(() => {})
    loadConvs()
    if (activeConv === id) { setActiveConv(null); setMessages([]) }
  }

  const handleSend = async (text) => {
    const userText = (text ?? input).trim()
    if (!userText && !selectedImage) return
    const imgData = selectedImage
    setInput('')
    setSelectedImage(null)
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

  const handleQuickPrompt = async (p) => {
    if (loading) return
    if (p.type === 'chat') { handleSend(p.question); return }
    const tempId = Date.now()
    setMessages((prev) => [...prev, { nguoiGui: 'user', noiDung: p.question, maTinNhan: tempId }])
    setLoading(true)
    try {
      const res = await api.post('/ai/analytics/ask', { question: p.question }).then(r => r.data)
      setMessages((prev) => [...prev, { nguoiGui: 'ai', noiDung: res.answer, analyticsLink: res.lienKet, maTinNhan: tempId + 1 }])
    } catch {
      setMessages((prev) => [...prev, { nguoiGui: 'ai', noiDung: 'Không thể kết nối AI, vui lòng thử lại sau.', maTinNhan: tempId + 1 }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const removeImage = () => setSelectedImage(null)

  const isSendDisabled = loading || (!input.trim() && !selectedImage)

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-noir-900 border border-gold/15">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gold/10 shrink-0 bg-noir-800/80">
        <div className="flex items-center gap-3">
          <RobotHead size="md" blink={blink} />
          <div>
            <p className="text-sm font-semibold text-ivory">Trợ lý ZestStore</p>
            <p className="text-[10px] text-stone-light/50">AI Fashion Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowSidebar(!showSidebar)}
            className={`p-2 rounded-lg transition-colors ${showSidebar ? 'bg-gold/15 text-gold' : 'text-stone-light/60 hover:text-ivory hover:bg-ivory/5'}`}
            title="Lịch sử hội thoại">
            <MessageSquare className="h-4 w-4" />
          </button>
          <button onClick={onClose}
            className="p-2 rounded-lg text-stone-light/60 hover:text-ivory hover:bg-ivory/5 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {showSidebar && (
          <div className="w-48 border-r border-gold/10 flex flex-col bg-noir-800/40 shrink-0">
            <div className="p-2 border-b border-gold/5">
              <button onClick={startNewConv}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gold hover:bg-gold/10 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Cuộc trò chuyện mới
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
              {conversations.length === 0 && (
                <p className="text-[11px] text-stone-light/40 text-center py-6">Chưa có hội thoại</p>
              )}
              {conversations
                .slice()
                .sort((a, b) => new Date(b.ngayTao || 0) - new Date(a.ngayTao || 0))
                .map((c) => (
                  <div key={c.maHoiThoai} role="button" tabIndex={0}
                    onClick={() => switchConv(c.maHoiThoai)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); switchConv(c.maHoiThoai) } }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                      activeConv === c.maHoiThoai ? 'bg-gold/10 text-gold' : 'text-stone-light/60 hover:bg-ivory/5 hover:text-stone-light/90'
                    }`}>
                    <span className="truncate flex-1">{c.tieuDe || 'Hội thoại'}</span>
                    <button onClick={(e) => handleDeleteConv(c.maHoiThoai, e)}
                      className="shrink-0 p-0.5 rounded hover:text-bordeaux hover:bg-bordeaux/10 opacity-0 group-hover:opacity-100 transition"
                      title="Xóa">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ scrollBehavior: 'smooth' }}>
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <RobotHead size="md" blink={blink} />
                <p className="text-sm text-ivory mt-4 font-medium">Xin chào! Tôi có thể giúp gì cho bạn?</p>
                <p className="text-xs text-stone-light/40 mt-1">
                  {quickPrompts.length > 0
                    ? 'Hỏi về doanh thu, đơn hàng, sản phẩm hoặc trò chuyện với AI.'
                    : 'Hãy hỏi về sản phẩm, size, chất liệu, hoặc bất kỳ câu hỏi nào về thời trang.'}
                </p>
                {quickPrompts.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mt-5">
                    {quickPrompts.map((p, i) => (
                      <button key={i} onClick={() => handleQuickPrompt(p)} disabled={loading}
                        className="px-3.5 py-2 rounded-full text-xs font-medium bg-noir-700 border border-gold/20 text-stone-light/70 hover:border-gold/50 hover:text-gold transition-colors disabled:opacity-50">
                        {p.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {messages.map((m) => (
              <div key={m.maTinNhan} className={`flex ${m.nguoiGui === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.nguoiGui === 'ai' && (
                  <div className="mr-2 self-end mb-1">
                    <div className="w-6 h-6 rounded-lg bg-gold flex items-center justify-center">
                      <span className="text-noir text-[10px] font-bold">ZS</span>
                    </div>
                  </div>
                )}
                <div className={`max-w-[75%] ${m.nguoiGui === 'user' ? 'order-first' : ''}`}>
                  <div className={`rounded-2xl px-3.5 py-2.5 ${
                    m.nguoiGui === 'user'
                      ? 'bg-gold text-noir rounded-br-md'
                      : 'bg-ivory border border-gold/15 text-ink rounded-bl-md'
                  }`}>
                    {m.hinhAnh && (
                      <img src={m.hinhAnh} alt="upload" className="max-w-full rounded-lg mb-1.5" style={{ maxHeight: '160px', objectFit: 'contain' }} />
                    )}
                    {m.noiDung && <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.noiDung}</p>}
                    {m.products && m.products.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {m.products.map((p) => (
                          <div key={p.maSanPham} onClick={() => { navigate(`/products/${p.slug}`); onClose() }}
                            className="flex items-center gap-2 bg-noir-900/5 rounded-xl px-2.5 py-2 cursor-pointer hover:bg-gold/10 transition-all w-full">
                            <img src={p.urlAnhDaiDien ? (p.urlAnhDaiDien.startsWith('http') || p.urlAnhDaiDien.startsWith('/api/') ? p.urlAnhDaiDien : `/api/files/${p.urlAnhDaiDien}`) : ''}
                              alt={p.tenSanPham} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate">{p.tenSanPham}</p>
                              <p className="text-xs text-gold font-semibold">{Number(p.gia || 0).toLocaleString('vi-VN')}đ</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {m.analyticsLink && (
                      <button onClick={() => { navigate(m.analyticsLink); onClose() }}
                        className="flex items-center gap-1 text-xs text-gold-dark hover:text-gold font-medium mt-2">
                        Xem chi tiết <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="mr-2 self-end mb-1">
                  <div className="w-6 h-6 rounded-lg bg-gold flex items-center justify-center">
                    <span className="text-noir text-[10px] font-bold">ZS</span>
                  </div>
                </div>
                <div className="bg-ivory border border-gold/15 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-2 h-2 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-2 h-2 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <div className="w-2 h-2 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-4 py-3 border-t border-gold/10 shrink-0 bg-noir-800/60">
            {selectedImage && (
              <div className="relative mb-2 inline-block">
                <img src={selectedImage} alt="preview" className="h-14 w-14 rounded-lg object-cover border border-gold/20" />
                <button onClick={removeImage}
                  className="absolute -top-1.5 -right-1.5 bg-bordeaux text-noir rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-noir-700 rounded-2xl px-3 py-1.5 border border-gold/10">
              <div className="relative" ref={attachRef}>
                <button onClick={() => { setShowAttach(!showAttach) }} disabled={loading}
                  className="text-stone-light/40 hover:text-gold p-1 transition disabled:opacity-50">
                  <Paperclip className="h-4 w-4" />
                </button>
                {showAttach && (
                  <div className="absolute bottom-full left-0 mb-1 bg-noir-800 border border-gold/10 rounded-xl shadow-lg p-1.5 flex gap-1">
                    <button onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-stone-light/60 hover:text-gold hover:bg-ivory/5 rounded-lg transition">
                      <Image className="h-3.5 w-3.5" /> Ảnh
                    </button>
                    <button onClick={() => cameraInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-stone-light/60 hover:text-gold hover:bg-ivory/5 rounded-lg transition">
                      <Camera className="h-3.5 w-3.5" /> Camera
                    </button>
                  </div>
                )}
              </div>
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} onPaste={handlePaste}
                placeholder="Nhắn tin..." disabled={loading}
                className="flex-1 bg-transparent text-sm text-ivory placeholder-stone-light/30 outline-none min-w-0" />
              <button onClick={() => handleSend()} disabled={isSendDisabled}
                className="bg-gold text-noir p-1.5 rounded-xl hover:bg-gold-hover transition disabled:opacity-50">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
      <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleCameraCapture} className="hidden" />
    </div>
  )
}
