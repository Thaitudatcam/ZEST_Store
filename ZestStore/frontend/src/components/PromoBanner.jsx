import { useState, useEffect } from 'react'
import { ArrowRight } from "lucide-react";
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

export default function PromoBanner() {
  const [targetDate] = useState(() => Date.now() + 30 * 24 * 60 * 60 * 1000)
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate))

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  const pad = (n) => String(n).padStart(2, '0')

  return (
    <section className="w-full bg-gradient-to-r from-slate-800 via-blue-900 to-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row h-auto md:h-[650px]">
        {/* ─── LEFT: Images ─── */}
        <div className="md:w-1/2 relative flex items-center justify-center p-8 md:p-14 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#ffffff08_0%,_transparent_70%)]" />
          <div className="relative w-full max-w-md">
            <img
              src="https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?w=600&q=80"
              alt="Model"
              className="w-full h-auto rounded-2xl shadow-2xl object-cover -rotate-[8deg] ring-1 ring-white/10"
            />
            <div className="absolute -bottom-4 -right-4 w-36 h-36 md:w-44 md:h-44 rounded-xl shadow-2xl border-[3px] border-neutral-950 overflow-hidden z-10 rotate-6">
              <img
                src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&q=80"
                alt="Product"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute top-8 left-8 grid grid-cols-4 gap-1.5 opacity-10 pointer-events-none">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 bg-white rounded-full" />
              ))}
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Content ─── */}
          <div className="md:w-1/2 relative flex items-center justify-center p-8 md:p-14 overflow-hidden">
          <div className="relative">
            <span className="inline-block bg-white/15 text-white text-xs font-medium tracking-widest px-4 py-1.5 rounded-full mb-5 border border-white/25 backdrop-blur-sm">
              ƯU ĐÃI ĐẶC BIỆT
            </span>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight tracking-tight">
                  ƯU ĐÃI  <br />TỚI
                  <span className="text-yellow-300"> 45%</span>
              </h2>

              <p className="text-blue-100 mb-8 max-w-lg text-sm md:text-base leading-relaxed">
                  Nâng tầm phong cách với những mẫu áo polo cao cấp.
                  Chương trình ưu đãi đặc biệt giúp bạn sở hữu sản phẩm chất lượng với mức giá hấp dẫn.
              </p>

              <div className="flex gap-3 md:gap-4 mb-8">
                  {[
                      { value: pad(timeLeft.days), label: 'Ngày' },
                      { value: pad(timeLeft.hours), label: 'Giờ' },
                      { value: pad(timeLeft.minutes), label: 'Phút' },
                      { value: pad(timeLeft.seconds), label: 'Giây' },
                  ].map(({ value, label }) => (
                      <div
                          key={label}
                          className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 md:px-5 md:py-4 text-center min-w-[70px] md:min-w-[80px] border border-blue-300/20 shadow-lg"
                      >
                          <div className="text-2xl md:text-3xl font-bold tabular-nums text-white">
                              {value}
                          </div>
                          <div className="text-xs text-blue-100 uppercase tracking-wider mt-1">
                              {label}
                          </div>
                      </div>
                  ))}
              </div>

              <a
                  href="#all-products"
                  className="group inline-flex items-center gap-2 bg-white text-slate-900 font-semibold px-8 py-3.5 rounded-full shadow-xl transition-all duration-300 hover:bg-yellow-300 hover:-translate-y-1 hover:shadow-2xl active:scale-95 w-fit"
              >
                  MUA NGAY
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
          </div>
        </div>
      </div>
    </section>
  )
}
