import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Send, Paperclip, Image, Camera, ArrowRight, ExternalLink } from 'lucide-react'
import { getConversations, getMessages, sendMessage, deleteConversation } from '../api/ai'

export function RobotHead({ size = 'sm', blink = false }) {
  const sizeMap = { sm: 'w-14 h-14', md: 'w-16 h-16' }
  return (
    <div className={`${sizeMap[size]} rounded-full bg-gradient-to-br from-[#f97316] to-[#ea580c] shadow-lg flex items-center justify-center`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
        stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className={`${size === 'sm' ? 'w-6 h-6' : 'w-7 h-7'}`}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </div>
  )
}

const CUSTOMER_QUICK_ACTIONS = [
  { label: 'Áo Polo', question: 'Giới thiệu áo polo' },
  { label: 'Khuyến mãi', question: 'Có chương trình khuyến mãi nào không?' },
  { label: 'Địa chỉ shop', question: 'Địa chỉ shop ở đâu?' },
]

const GREETING = "Chào bạn! Em là Trợ lý AI của ZestStore. Em có thể hỗ trợ gì cho anh/chị hôm nay?"

export default function AiChatPanel({ open, onClose, quickPrompts = [] }) {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [showAttach, setShowAttach] = useState(false)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const attachRef = useRef(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ nguoiGui: 'ai', noiDung: GREETING, maTinNhan: 'greeting' }])
    }
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
      const result = await sendMessage(userText, null, imgData)
      setMessages((prev) => [...prev, { nguoiGui: 'ai', noiDung: result.reply, products: result.products || [], maTinNhan: tempId + 1 }])
    } catch {
      setMessages((prev) => [...prev, { nguoiGui: 'ai', noiDung: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.', maTinNhan: tempId + 1 }])
    } finally { setLoading(false) }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const removeImage = () => setSelectedImage(null)

  const isSendDisabled = loading || (!input.trim() && !selectedImage)

  const formatPrice = (price) => Number(price || 0).toLocaleString('vi-VN')

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-noir-900 border border-gold/15 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gold/10 shrink-0 bg-gradient-to-r from-[#f97316] to-[#ea580c] rounded-t-2xl">
        <div className="flex items-center gap-3">
          <RobotHead size="md" />
          <div>
            <p className="text-sm font-bold text-white">Trợ lý AI</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <p className="text-[10px] text-white/80">Trực tuyến</p>
            </div>
          </div>
        </div>
        <button onClick={onClose}
          className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ scrollBehavior: 'smooth' }}>
        {messages.map((m) => (
          <div key={m.maTinNhan} className={`flex ${m.nguoiGui === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.nguoiGui === 'ai' && (
              <div className="mr-2 self-end mb-1 shrink-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">ZS</span>
                </div>
              </div>
            )}
            <div className={`max-w-[80%] ${m.nguoiGui === 'user' ? 'order-first' : ''}`}>
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
                  <div className="mt-2.5 space-y-2">
                    {m.products.map((p) => (
                      <div key={p.maSanPham}
                        className="bg-white border border-stone/15 rounded-xl overflow-hidden hover:shadow-md transition-all cursor-pointer"
                        onClick={() => { navigate(`/products/${p.slug}`); onClose() }}>
                        <div className="flex gap-3 p-3">
                          <img src={p.urlAnhDaiDien ? (p.urlAnhDaiDien.startsWith('http') || p.urlAnhDaiDien.startsWith('/api/') ? p.urlAnhDaiDien : `/api/files/${p.urlAnhDaiDien}`) : ''}
                            alt={p.tenSanPham} className="w-16 h-16 rounded-lg object-cover shrink-0 border border-stone/10" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-ink truncate">{p.tenSanPham}</p>
                            <p className="text-sm font-bold text-[var(--primary-color)] mt-0.5">{formatPrice(p.gia)}đ</p>
                          </div>
                        </div>
                        <div className="px-3 pb-2.5 space-y-1">
                          {p.maSanPhamCode && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-semibold text-stone uppercase tracking-wide">Mã:</span>
                              <span className="text-[10px] font-bold text-ink">{p.maSanPhamCode}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-stone">Giá:</span>
                            <span className="text-[10px] font-semibold text-ink">{formatPrice(p.gia)}đ</span>
                          </div>
                          {p.mauSac && p.mauSac.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-stone">Có màu sắc:</span>
                              <span className="text-[10px] font-semibold text-ink">{p.mauSac.join(', ')}</span>
                            </div>
                          )}
                          {p.kichCo && p.kichCo.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-stone">Kích thước:</span>
                              <span className="text-[10px] font-semibold text-ink">{p.kichCo.join(', ')}</span>
                            </div>
                          )}
                          {p.chatLieu && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-stone">Chất liệu:</span>
                              <span className="text-[10px] font-semibold text-ink">{p.chatLieu}</span>
                            </div>
                          )}
                        </div>
                        <div className="px-3 pb-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--primary-color)] hover:underline">
                            Xem chi tiết <ExternalLink className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="mr-2 self-end mb-1 shrink-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">ZS</span>
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

      {/* Quick Actions */}
      <div className="px-3 pb-1.5 shrink-0">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {CUSTOMER_QUICK_ACTIONS.map((action, i) => (
            <button key={i} onClick={() => handleSend(action.question)} disabled={loading}
              className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium bg-noir-700 border border-gold/15 text-stone-light/70 hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-50">
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-1 shrink-0">
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
            placeholder="Nhập tin nhắn..." disabled={loading}
            className="flex-1 bg-transparent text-sm text-ivory placeholder-stone-light/30 outline-none min-w-0" />
          <button onClick={() => handleSend()} disabled={isSendDisabled}
            className="bg-gold text-noir p-1.5 rounded-xl hover:bg-gold-hover transition disabled:opacity-50">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
      <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleCameraCapture} className="hidden" />
    </div>
  )
}
