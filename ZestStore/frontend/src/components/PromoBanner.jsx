import { useState, useEffect, useCallback } from 'react'
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import ao from '../pictures/aopolo.jpg'
import ao1 from '../pictures/Áo polo nam Trắng.jpg'
import ao2 from '../pictures/Áo polo thể thao Trắng.jpg'
import ao3 from '../pictures/Áo Thun Nam Cao Cấp Polo Màu Xanh Navy.webp'
const banners = [
  {
    id: 1,
    badge: 'Hot',
    badgeColor: 'bg-red-500',
    title: 'FLASH SALE',
    highlight: 'GIẢM ĐẾN 45%',
    highlightColor: 'text-red-500',
    desc: 'Cơ hội sở hữu áo polo, áo thun nam cao cấp với giá cực sốc. Chỉ trong thời gian giới hạn!',
    img: ao1,
    link: '/products/o-polo-nam-1783922287918',
  },

  {
    id: 3,
    badge: 'Limited',
    badgeColor: 'bg-orange-500',
    title: 'ƯU ĐÃI ĐẶC BIỆT',
    highlight: 'MUA 2 TẶNG 1',
    highlightColor: 'text-orange-400',
    desc: 'Deal cực hời. Lên đồ đẹp – giá lại ngon. Chốt nhanh trước khi hết!',
    img: ao2,
    link: '/products/o-polo-th-thao-1783925305046',
  },
]

const sideBanners = [
  {
    id: 4,
    badge: 'New',
    title: 'NEW ARRIVAL',
    desc: 'Thiết kế hiện đại – dễ phối, mặc là đẹp',
    img: ao,
    link: '/products/o-polo-xanh-en-ph-i-c-th-u-1783920144078',
  },
  {
    id: 5,
    badge: 'Limited',
    title: 'MIỄN PHÍ VẬN CHUYỂN',

    desc: 'Giao hàng toàn quốc',
    img: ao3,
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
  const [targetDate] = useState(() => Date.now() + 15 * 24 * 60 * 60 * 1000)
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
            <a href={b.link} className="block relative h-[280px] md:h-[340px] lg:h-[380px]">
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

                <p className="text-white/60 text-sm md:text-base max-w-md leading-relaxed">
                  {b.desc}
                </p>
              </div>
            </a>

            {/* Carousel arrows */}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); prev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); next(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-6 md:left-10 flex gap-1.5 z-10">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrent(i); }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === current ? 'w-6 bg-red-500' : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
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
                className="group relative flex-1 rounded-xl overflow-hidden shadow-lg bg-neutral-900 min-h-[130px] md:min-h-[160px] lg:min-h-[180px]"
              >
                <img
                  src={sb.img}
                  alt={sb.title}
                  className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${
                    hovered === sb.id ? 'scale-105' : 'scale-100'
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

                <div className="absolute inset-0 flex flex-col justify-center p-5 md:p-6">
                  <span className="inline-block bg-blue-600 text-white text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-sm w-fit mb-2">
                    {sb.badge}
                  </span>
                  <h3 className="text-white text-[10px] font-medium tracking-[0.2em] mb-1">{sb.title}</h3>
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
