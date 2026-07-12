import { useState, useEffect, useCallback } from 'react'
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react'

const banners = [
  {
    id: 1,
    badge: 'Hot',
    badgeColor: 'bg-red-500',
    title: 'FLASH SALE',
    highlight: 'GIẢM ĐẾN 45%',
    highlightColor: 'text-red-500',
    desc: 'Cơ hội sở hữu áo polo, áo thun nam cao cấp với giá cực sốc. Chỉ trong thời gian giới hạn!',
    img: 'https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?w=700&q=85',
    link: '#all-products',
  },
  {
    id: 2,
    badge: 'New',
    badgeColor: 'bg-blue-600',
    title: 'BỘ SƯU TẬP MỚI',
    highlight: 'THU ĐÔNG 2026',
    highlightColor: 'text-white',
    desc: 'Thiết kế hiện đại, chất liệu cao cấp — dẫn đầu xu hướng thời trang nam mùa mới.',
    img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=700&q=85',
    link: '#all-products',
  },
  {
    id: 3,
    badge: 'Limited',
    badgeColor: 'bg-orange-500',
    title: 'ƯU ĐÃI ĐẶC BIỆT',
    highlight: 'MUA 2 TẶNG 1',
    highlightColor: 'text-orange-400',
    desc: 'Áp dụng cho tất cả sản phẩm áo polo form chuẩn. Nhanh tay kẻo hết!',
    img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=700&q=85',
    link: '#all-products',
  },
]

const sideBanners = [
  {
    id: 4,
    badge: 'New',
    title: 'BỘ SƯU TẬP MỚI',
    subtitle: 'THU ĐÔNG 2026',
    desc: 'Phong cách đỉnh cao',
    img: 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=400&q=80',
    link: '#all-products',
  },
  {
    id: 5,
    badge: 'Limited',
    title: 'MIỄN PHÍ VẬN CHUYỂN',
    subtitle: 'ĐƠN TỪ 299K',
    desc: 'Giao hàng toàn quốc',
    img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80',
    link: '#all-products',
  },
]

function getTimeLeft(target) {
  const diff = target - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

const pad = (n) => String(n).padStart(2, '0')

export default function PromoBanner() {
  const [current, setCurrent] = useState(0)
  const [targetDate] = useState(() => Date.now() + 30 * 24 * 60 * 60 * 1000)
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate))
  const [hovered, setHovered] = useState(null)

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  const next = useCallback(() => setCurrent((p) => (p + 1) % banners.length), [])
  const prev = useCallback(() => setCurrent((p) => (p - 1 + banners.length) % banners.length), [])

  useEffect(() => {
    const id = setInterval(next, 5000)
    return () => clearInterval(id)
  }, [next])

  const b = banners[current]

  return (
    <section className="w-full py-4 md:py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">

          {/* ─── MAIN BANNER (CAROUSEL) ─── */}
          <div className="lg:col-span-2 relative group rounded-xl overflow-hidden shadow-2xl bg-neutral-900">
            {/* Image */}
            <div className="relative h-[250px] md:h-[310px] lg:h-[350px]">
              <img
                src={b.img}
                alt={b.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[800ms] group-hover:scale-105"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-center p-6 md:p-10 lg:p-12">
                {/* Badge + timer row */}
                <div className="flex items-center gap-3 mb-3">
                  <span className={`${b.badgeColor} text-white text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-sm`}>
                    {b.badge}
                  </span>
                  <div className="flex items-center gap-1.5 text-white/80 text-xs">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="tracking-wider tabular-nums">
                      {pad(timeLeft.days)}d : {pad(timeLeft.hours)}h : {pad(timeLeft.minutes)}m : {pad(timeLeft.seconds)}s
                    </span>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  <h3 className="text-white/60 text-xs md:text-sm font-medium tracking-[0.25em]">{b.title}</h3>
                  <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold ${b.highlightColor} leading-tight`}>
                    {b.highlight}
                  </h2>
                </div>

                <p className="text-white/60 text-sm md:text-base max-w-md leading-relaxed mb-6">
                  {b.desc}
                </p>

                <a
                  href={b.link}
                  className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 w-fit text-sm shadow-lg hover:shadow-red-500/25"
                >
                  Mua ngay
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>

              {/* Carousel arrows */}
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Dots */}
              <div className="absolute bottom-4 left-6 md:left-10 flex gap-1.5">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === current ? 'w-6 bg-red-500' : 'w-1.5 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ─── SIDE BANNERS ─── */}
          <div className="flex flex-col gap-4 md:gap-5">
            {sideBanners.map((sb) => (
              <a
                key={sb.id}
                href={sb.link}
                onMouseEnter={() => setHovered(sb.id)}
                onMouseLeave={() => setHovered(null)}
                className="group relative flex-1 rounded-xl overflow-hidden shadow-lg bg-neutral-900 min-h-[80px] md:min-h-[110px] lg:min-h-[130px]"
              >
                <img
                  src={sb.img}
                  alt={sb.title}
                  className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${
                    hovered === sb.id ? 'scale-105' : 'scale-100'
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

                <div className="absolute inset-0 flex flex-col justify-center p-4 md:p-5">
                  <span className="inline-block bg-blue-600 text-white text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-sm w-fit mb-2">
                    {sb.badge}
                  </span>
                  <h3 className="text-white/50 text-[10px] font-medium tracking-[0.2em] mb-1">{sb.title}</h3>
                  <h2 className="text-white text-lg md:text-xl font-bold leading-tight mb-1">{sb.subtitle}</h2>
                  <p className="text-white/50 text-xs">{sb.desc}</p>
                </div>

                {/* Hover arrow */}
                <div className={`absolute right-4 bottom-4 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${
                  hovered === sb.id ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
                }`}>
                  <ChevronRight className="h-4 w-4 text-white" />
                </div>
              </a>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
