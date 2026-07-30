import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Send, Paperclip, Image, Camera } from 'lucide-react'
import { getConversations, getMessages, sendMessage } from '../api/ai'

function RobotHead({ size = 'sm', blink = false }) {
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

export default function AiChat() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [showAttach, setShowAttach] = useState(false)
  const [blink, setBlink] = useState(false)
  const [lastUserMsg, setLastUserMsg] = useState(null)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const attachRef = useRef(null)

  const loadConvs = useCallback(async () => {
    try { setConversations(await getConversations()) } catch {}
  }, [])

  useEffect(() => {
    if (!open) return
    const restore = async () => {
      try {
        const convs = await getConversations()
        setConversations(convs)
        if (convs.length > 0) {
          convs.sort((a, b) => new Date(b.ngayTao || 0) - new Date(a.ngayTao || 0))
          const msgs = await getMessages(convs[0].maHoiThoai)
          setActiveConv(convs[0].maHoiThoai)
          setMessages(Array.isArray(msgs) ? msgs.slice(-3) : [])
        }
      } catch {}
    }
    restore()
  }, [open, loadConvs])

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

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return
    const userText = input
    const imgData = selectedImage
    const msg = userText || (imgData ? '[Hình ảnh]' : '')
    setLastUserMsg(msg)
    setTimeout(() => setLastUserMsg(null), 4000)
    setInput('')
    setSelectedImage(null)
    setShowAttach(false)
    setLoading(true)
    const tempId = Date.now()
    setMessages((prev) => [...prev, { nguoiGui: 'user', noiDung: userText, hinhAnh: imgData, maTinNhan: tempId }])
    try {
      const result = await sendMessage(userText, activeConv, imgData)
      setMessages((prev) => [...prev, { nguoiGui: 'ai', noiDung: result.reply, products: result.products || [], maTinNhan: tempId + 1 }].slice(-4))
      setLastUserMsg(null)
      if (!activeConv) setActiveConv(result.maHoiThoai)
      loadConvs()
    } catch {} finally { setLoading(false) }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const removeImage = () => setSelectedImage(null)

  const isSendDisabled = loading || (!input.trim() && !selectedImage)
  const latestAiMsg = [...messages].reverse().find(m => m.nguoiGui === 'ai')

  return (
    <>
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 hover:scale-110 transition-transform duration-200 animate-float cursor-pointer">
          <RobotHead size="sm" blink={blink} />
        </button>
      ) : (
        <div className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-2 sm:gap-3 max-w-[calc(100vw-24px)] sm:max-w-none">
          <button onClick={() => setOpen(false)}
            className="w-7 h-7 rounded-full bg-noir-700 border border-gold/10 flex items-center justify-center text-stone-light/60 hover:text-ivory hover:border-gold/30 transition-all shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>

          <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
            {lastUserMsg && (
              <div className="text-xs text-stone/50 italic px-3 py-1.5 bg-noir-800/70 rounded-xl animate-fade-in max-w-[200px]">
                Bạn: &quot;{lastUserMsg}&quot;
              </div>
            )}

            {loading && (
              <div className="bg-ivory border border-gold/20 rounded-2xl px-4 py-3 shadow-lg animate-fade-in">
                <div className="flex gap-1.5 items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="w-2 h-2 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-2 h-2 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            )}

            {latestAiMsg && (
              <div className="relative bg-ivory border border-gold/20 rounded-2xl px-4 py-3 shadow-lg max-w-[260px] sm:max-w-[280px] animate-fade-in">
                <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-ivory border-r border-b border-gold/20 rotate-45" />
                {latestAiMsg.hinhAnh && (
                  <img src={latestAiMsg.hinhAnh} alt="upload" className="max-w-full rounded-lg mb-2" style={{ maxHeight: '120px', objectFit: 'contain' }} />
                )}
                {latestAiMsg.noiDung && <p className="text-sm text-ink leading-relaxed">{latestAiMsg.noiDung}</p>}
                {latestAiMsg.products && latestAiMsg.products.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {latestAiMsg.products.map((p) => (
                      <div key={p.maSanPham} onClick={() => { navigate(`/products/${p.slug}`); setOpen(false) }}
                        className="flex items-center gap-2 bg-ivory-100 rounded-xl px-2.5 py-2 cursor-pointer hover:bg-gold/10 transition-all w-full">
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
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-end gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="order-1 sm:order-2 shrink-0">
              <RobotHead size="sm" blink={blink} />
            </div>
            <div className="order-2 sm:order-1 w-full sm:w-auto">
              {previewUrl && (
                <div className="relative mb-2 inline-block">
                  <img src={previewUrl} alt="preview" className="h-14 w-14 rounded-lg object-cover border border-gold/20" />
                  <button onClick={removeImage}
                    className="absolute -top-1.5 -right-1.5 bg-bordeaux text-noir rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-noir-800 rounded-2xl px-3 py-1.5 shadow-xl border border-gold/10">
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
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Nhắn tin..." disabled={loading}
                  className="flex-1 bg-transparent text-sm text-ivory placeholder-stone-light/30 outline-none min-w-[120px] sm:min-w-[160px]" />
                <button onClick={handleSend} disabled={isSendDisabled}
                  className="bg-gold text-noir p-1.5 rounded-xl hover:bg-gold-hover transition disabled:opacity-50">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
          <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleCameraCapture} className="hidden" />
        </div>
      )}
    </>
  )
}
