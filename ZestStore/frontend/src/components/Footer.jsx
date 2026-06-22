import { Mail, Phone, MapPin, ArrowUp } from 'lucide-react'

const socials = [
  { label: 'Facebook', color: 'hover:text-blue-500', svg: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /> },
  { label: 'Instagram', color: 'hover:text-pink-500', svg: <><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" /></> },
  { label: 'TikTok', color: 'hover:text-gray-100', svg: <path d="M9 12a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 0V3h4v2a4 4 0 0 0 4 4v4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /> },
  { label: 'YouTube', color: 'hover:text-red-500', svg: <><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" /><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" /></> },
]

const payments = ['Visa', 'Mastercard', 'MoMo', 'VNPay', 'COD']

export default function Footer() {
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <footer className="bg-gray-900 text-gray-400 mt-16 relative">
      <button onClick={scrollTop} className="absolute -top-4 right-6 bg-blue-700 text-white p-2 rounded-full hover:bg-blue-600 transition shadow-lg z-10">
        <ArrowUp className="h-4 w-4" />
      </button>
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white font-bold text-lg mb-3">ZestStore</h3>
          <p className="text-sm leading-relaxed">Thương hiệu thời trang polo nam cao cấp. Chất liệu thoáng mát, thiết kế hiện đại, phù hợp mọi phong cách.</p>
          <div className="flex gap-3 mt-4">
            {socials.map(({ label, color, svg }) => (
              <a key={label} href="#" aria-label={label} className={`w-8 h-8 flex items-center justify-center border border-gray-700 rounded-full ${color} transition`}>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{svg}</svg>
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Liên hệ</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0" /> support@zeststore.vn</li>
            <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" /> 1900 1234</li>
            <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" /> 123 Nguyễn Huệ, Q.1, TP.HCM</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Chính sách</h4>
          <ul className="space-y-2 text-sm">
            {['Chính sách đổi trả', 'Chính sách bảo mật', 'Chính sách vận chuyển', 'Hướng dẫn mua hàng'].map((s) => (
              <li key={s} className="hover:text-white cursor-pointer transition">{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Thanh toán</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {payments.map((p) => (
              <span key={p} className="bg-gray-800 text-gray-300 text-[10px] font-medium px-2.5 py-1 rounded border border-gray-700">{p}</span>
            ))}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">Cam kết thanh toán an toàn, bảo mật thông tin khách hàng.</p>
        </div>
      </div>
      <div className="border-t border-gray-800 py-4 text-center text-[11px]">&copy; {new Date().getFullYear()} ZestStore. Thiết kế bởi ZestStore Team.</div>
    </footer>
  )
}
