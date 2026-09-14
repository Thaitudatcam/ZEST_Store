import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import poloImg from '../pictures/aopolo.jpg'

export default function AboutPage() {
  return (
    <div>
      <nav className="max-w-6xl mx-auto px-4 pt-6 flex items-center gap-1 text-sm text-stone">
        <Link to="/" className="hover:text-gold">Trang chủ</Link>
        <span className="text-stone/40">/</span>
        <span className="text-ink font-semibold">Về chúng tôi</span>
      </nav>

      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-noir via-noir/95 to-noir/80 mt-6 py-16 md:py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/10 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <p className="text-gold text-xs md:text-sm font-semibold tracking-[0.25em] uppercase mb-4">
            Đồng hành cùng phong cách
          </p>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-gold mb-6 leading-tight">
            Thời trang nam chuẩn mực
          </h1>
          <p className="text-stone-light/70 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            ZestStore ra đời với sứ mệnh mang đến cho nam giới Việt Nam những giải pháp trang phục tối giản, thoải mái và hiện đại trên nền tảng tự tin.
          </p>
        </div>
      </section>

      {/* Brand Story - 2 columns */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left - Text */}
          <div>
            <p className="text-gold text-xs font-semibold tracking-[0.2em] uppercase mb-3">
              Câu chuyện thương hiệu
            </p>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-ink mb-4 leading-snug">
              Sự tối giản tạo nên đẳng cấp và thoải mái
            </h2>
            <p className="text-stone text-sm leading-relaxed mb-4">
              Mùa hè tại Việt Nam luôn cần những trang phục vừa lịch sự, vừa mang lại sự thoáng mát tối đa. ZestStore tự hào sử dụng chất liệu cao cấp như Cotton Compact 100%, Thun Cation 4 chiều và Vải Dệt Lưới tự nhiên để mang đến cảm giác dễ chịu nhất cả ngày dài.
            </p>
            <p className="text-stone text-sm leading-relaxed mb-6">
              Mỗi thiết kế áo Polo, áo Sơ mi và Áo Thun đều được cắt may chuẩn form người Việt, giữ được sự phong độ khi đi làm, đi chơi hay du lịch biển.
            </p>
            <Link
              to="/"
              className="group inline-flex items-center gap-2 px-6 py-3 bg-gold text-noir font-semibold rounded-full text-sm hover:bg-gold-light hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.97]"
            >
              Khám phá bộ sưu tập
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Right - Image */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img
                src={poloImg}
                alt="ZestStore - Thời trang nam"
                className="w-full h-[360px] md:h-[420px] object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-gold text-noir rounded-xl px-5 py-3 shadow-lg">
              <span className="block text-2xl font-bold">100%</span>
              <span className="text-xs font-medium">Chất liệu cotton chuẩn</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-ivory py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gold text-xs font-semibold tracking-[0.2em] uppercase mb-3">
            Giá trị cốt lõi
          </p>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-ink mb-10">
            Vì sao chọn ZestStore
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Chất lượng',
                desc: 'Vải cotton/pique cao cấp, form áo bền sau nhiều lần giặt.',
              },
              {
                title: 'Đa dạng',
                desc: 'Polo Nam, Sơ mi, Quần Tây — phối đồ linh hoạt mọi hoàn cảnh.',
              },
              {
                title: 'Tận tâm',
                desc: 'Tư vấn chọn size, hỗ trợ đổi trả dễ dàng trong 7 ngày.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-6 shadow-sm border border-stone/10">
                <h3 className="font-bold text-ink mb-2">{item.title}</h3>
                <p className="text-stone text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-16 text-center">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 px-8 py-3 bg-gold text-noir font-semibold rounded-full text-sm shadow-gold hover:bg-gold-light hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.97]"
        >
          Khám phá bộ sưu tập
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </section>
    </div>
  )
}
