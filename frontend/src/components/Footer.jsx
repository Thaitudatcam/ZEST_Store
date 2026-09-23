import { Mail, Phone, MapPin, ArrowUp } from 'lucide-react'
import { Link } from 'react-router-dom'

const socials = [
  { label: 'Facebook', svg: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /> },
  { label: 'Instagram', svg: <><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" /></> },
  { label: 'TikTok', svg: <path d="M9 12a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 0V3h4v2a4 4 0 0 0 4 4v4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /> },
  { label: 'YouTube', svg: <><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" /><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" /></> },
]

const payments = ['Visa', 'Mastercard', 'VNPay', 'ZaloPay', 'COD']

export default function Footer() {
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <footer className="bg-noir text-stone-light/70 mt-16 relative">
      {/* Gold hairline top */}
      <div className="divider-gold" />
      <button onClick={scrollTop} className="absolute -top-4 right-6 bg-gold text-noir p-2.5 rounded-full hover:bg-gold-light transition shadow-gold z-10" aria-label="Lên đầu trang">
        <ArrowUp className="h-4 w-4" />
      </button>
      <div className="max-w-7xl mx-auto px-4 py-14 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="font-serif text-ivory font-bold text-2xl mb-3">Zest<span className="text-gold">Store</span></h3>
          <p className="text-sm leading-relaxed">Thương hiệu thời trang polo nam cao cấp. Chất liệu thoáng mát, thiết kế hiện đại, phù hợp mọi phong cách.</p>
          <div className="flex gap-3 mt-5">
            {socials.map(({ label, svg }) => (
              <a key={label} href="#" aria-label={label} className="w-9 h-9 flex items-center justify-center border border-white/10 rounded-full text-stone-light/60 hover:border-gold/50 hover:text-gold transition-all duration-200">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{svg}</svg>
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-ivory font-semibold mb-4 text-xs uppercase tracking-[0.2em]">Liên hệ</h4>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0 text-gold/70" /> support@zeststore.vn</li>
            <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0 text-gold/70" /> 1900 1234</li>
            <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0 text-gold/70" /> 123 Nguyễn Huệ, Q.1, TP.HCM</li>
          </ul>
        </div>
        <div>
          <h4 className="text-ivory font-semibold mb-4 text-xs uppercase tracking-[0.2em]">Chính sách</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/policies/doi-tra" className="hover:text-gold transition">Chính sách đổi trả</Link></li>
            <li><Link to="/policies/bao-mat" className="hover:text-gold transition">Chính sách bảo mật</Link></li>
            <li><Link to="/policies/dieu-khoan-dich-vu" className="hover:text-gold transition">Điều khoản dịch vụ</Link></li>
            <li><Link to="/policies/chinh-sach-su-dung" className="hover:text-gold transition">Chính sách sử dụng</Link></li>
            <li><Link to="/policies/van-chuyen" className="hover:text-gold transition">Chính sách vận chuyển</Link></li>
            <li><Link to="/policies/huong-dan-mua-hang" className="hover:text-gold transition">Hướng dẫn mua hàng</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-ivory font-semibold mb-4 text-xs uppercase tracking-[0.2em]">Thanh toán</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {payments.map((p) => (
              <span key={p} className="bg-noir-700 text-stone-light/70 text-[10px] font-medium px-2.5 py-1 rounded border border-white/10">{p}</span>
            ))}
          </div>
          <p className="text-xs text-stone-light/50 leading-relaxed">Cam kết thanh toán an toàn, bảo mật thông tin khách hàng.</p>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-[11px] text-stone-light/40">&copy; {new Date().getFullYear()} ZestStore. Thiết kế bởi ZestStore Team.</div>
    </footer>
  )
}
