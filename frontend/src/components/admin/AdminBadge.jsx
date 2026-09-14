const colorMap = {
  gold: 'bg-gold/15 text-gold border-gold/20',
  green: 'bg-emerald-deep/15 text-emerald-deep border-emerald-deep/20',
  blue: 'bg-gold/15 text-gold border-gold/20',
  purple: 'bg-royal/15 text-royal border-royal/20',
  red: 'bg-bordeaux/15 text-bordeaux border-bordeaux/20',
  gray: 'bg-stone/15 text-stone border-stone/20',
}

export default function AdminBadge({ color = 'gray', children }) {
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${colorMap[color] || colorMap.gray}`}>
      {children}
    </span>
  )
}
