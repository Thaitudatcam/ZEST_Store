import { PackageOpen, SearchX, Inbox, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'

const iconMap = { PackageOpen, SearchX, Inbox, ShoppingBag }

export default function EmptyState({ icon = 'Inbox', title = 'Không có dữ liệu', description, actionLabel, actionTo }) {
  const Icon = iconMap[icon] || Inbox
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="h-10 w-10 text-gray-300" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-400 max-w-xs">{description}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
