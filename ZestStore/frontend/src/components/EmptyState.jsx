import { PackageOpen, SearchX, Inbox, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'

const iconMap = { PackageOpen, SearchX, Inbox, ShoppingBag }

export default function EmptyState({ icon = 'Inbox', title = 'Không có dữ liệu', description, actionLabel, actionTo }) {
  const Icon = iconMap[icon] || Inbox
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-ivory-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="h-10 w-10 text-stone" />
      </div>
      <h3 className="text-lg font-semibold text-ink-soft mb-1">{title}</h3>
      {description && <p className="text-sm text-stone max-w-xs">{description}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="mt-4 bg-gold text-noir px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gold transition">
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
