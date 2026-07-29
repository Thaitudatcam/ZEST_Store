/**
 * Badge — semantic pill built on the Atelier palette.
 * tones: gold · noir · bordeaux · emerald · royal · stone
 */
const tones = {
  gold: 'bg-gold/15 text-gold-dark border-gold/25',
  noir: 'bg-noir/10 text-noir border-noir/20',
  bordeaux: 'bg-bordeaux/10 text-bordeaux border-bordeaux/25',
  emerald: 'bg-emerald-deep/10 text-emerald-deep border-emerald-deep/25',
  royal: 'bg-royal/10 text-royal border-royal/25',
  stone: 'bg-stone/10 text-stone border-stone/20',
}

export default function Badge({ tone = 'stone', className = '', children }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${tones[tone] || tones.stone} ${className}`}>
      {children}
    </span>
  )
}
