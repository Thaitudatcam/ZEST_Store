/**
 * Button — ZestStore Atelier primary action primitive.
 * Variants: primary (gold) · noir · outline · ghost · gold-soft
 * Sizes: sm · md · lg
 * Use tokens; never raw blue hex.
 */
const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-200 active:scale-[0.98] focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 whitespace-nowrap'

const variants = {
  primary:
    'bg-gold text-noir hover:bg-gold-hover shadow-gold hover:-translate-y-0.5',
  noir:
    'bg-noir text-ivory hover:bg-noir-800 shadow-lux hover:-translate-y-0.5',
  outline:
    'border border-gold/50 text-gold hover:bg-gold hover:text-noir bg-transparent',
  ghost:
    'text-ink hover:bg-gold-50 hover:text-gold-dark bg-transparent',
  'gold-soft':
    'bg-gold-50 text-gold-dark hover:bg-gold/15 border border-gold/20',
}

const sizes = {
  sm: 'text-xs px-4 py-2',
  md: 'text-sm px-6 py-2.5',
  lg: 'text-sm px-8 py-3.5',
}

export default function Button({
  as: Comp = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  return (
    <Comp className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`} {...props}>
      {children}
    </Comp>
  )
}
