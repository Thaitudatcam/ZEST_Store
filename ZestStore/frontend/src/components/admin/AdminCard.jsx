export default function AdminCard({ children, className = '' }) {
  return (
    <div className={`bg-dark-700 border border-dark-border rounded-2xl ${className}`}>
      {children}
    </div>
  )
}