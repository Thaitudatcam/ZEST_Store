import { Link } from 'react-router-dom'
import { ChevronRight, ArrowRight } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-1 text-sm text-stone mb-6">
        <Link to="/" className="hover:text-gold">Trang chủ</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-ink font-semibold">Giới thiệu</span>
      </nav>

      <div className="bg-noir rounded-xl p-8 md:p-12 mb-8 text-center relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-gold/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-gold/5 rounded-full blur-3xl" />
        <h1 className="font-serif text-2xl md:text-4xl font-bold text-ivory mb-3 relative z-10">
          ZestStore — Phong cách nam tính, chuẩn mực từng đường kim mũi chỉ
        </h1>
        <p className="text-stone-light/80 text-sm md:text-base max-w-xl mx-auto leading-relaxed relative z-10">
          Thương hiệu polo &amp; thời trang công sở dành cho người đàn ông hiện đại: gọn gàng, tự tin, không cầu kỳ.
        </p>
      </div>

      <div className="space-y-6">
        <section className="bg-ivory border rounded-xl p-6">
          <h2 className="text-lg font-bold text-ink mb-2">1. Câu chuyện thương hiệu</h2>
          <p className="text-stone leading-relaxed text-sm">
            ZestStore ra đời với mong muốn mang đến những chiếc áo polo chất lượng, form dáng chuẩn, phù hợp với vóc dáng người Việt — từ đi làm, đi chơi đến những dịp cần sự chỉn chu.
          </p>
        </section>

        <section className="bg-ivory border rounded-xl p-6">
          <h2 className="text-lg font-bold text-ink mb-2">2. Sứ mệnh &amp; Giá trị cốt lõi</h2>
          <ul className="text-stone leading-relaxed text-sm space-y-2">
            <li><strong className="text-ink">Chất lượng:</strong> Vải cotton/pique cao cấp, form áo bền form sau nhiều lần giặt.</li>
            <li><strong className="text-ink">Đa dạng:</strong> Polo Nam, Polo Nữ, Quần Tây — phối đồ linh hoạt.</li>
            <li><strong className="text-ink">Tận tâm:</strong> Tư vấn chọn size/phối đồ bằng AI, hỗ trợ đổi trả dễ dàng.</li>
          </ul>
        </section>

        <section className="bg-ivory border rounded-xl p-6">
          <h2 className="text-lg font-bold text-ink mb-2">3. Vì sao chọn ZestStore</h2>
          <ul className="text-stone leading-relaxed text-sm space-y-2">
            <li>Form áo được đo may theo số liệu thực tế người Việt.</li>
            <li>Cam kết đổi trả trong 7 ngày nếu lỗi từ nhà sản xuất.</li>
            <li>Tích điểm thành viên, ưu đãi độc quyền.</li>
          </ul>
        </section>

        <section className="bg-ivory border rounded-xl p-6 text-center">
          <h2 className="text-lg font-bold text-ink mb-3">4. Khám phá bộ sưu tập</h2>
          <Link to="/"
            className="group inline-flex items-center gap-2 px-8 py-3 bg-gold text-noir font-semibold rounded-full text-sm shadow-gold hover:bg-gold-light hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.97]">
            Khám phá bộ sưu tập
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </section>
      </div>
    </div>
  )
}
