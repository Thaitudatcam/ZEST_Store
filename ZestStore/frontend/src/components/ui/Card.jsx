/**
 * Card — ivory surface with soft luxury shadow.
 * variants: surface (default) · dark · bare
 */
const variants = {
  surface: 'bg-white border border-noir-600/10 shadow-lux rounded-2xl',
  dark: 'bg-noir-800 border border-white/5 shadow-lux rounded-2xl text-ivory',
  bare: 'bg-transparent',
}

export default function Card({ variant = 'surface', className = '', children, ...props }) {
  return (
    <div className={`${variants[variant] || variants.surface} ${className}`} {...props}>
      {children}
    </div>
  )
}
