export default function GradientText({ children, className = '', from = '#00d4ff', to = '#7cff67', direction = 'to right' }) {
  return (
    <span className={`bg-clip-text text-transparent ${className}`} style={{ backgroundImage: `linear-gradient(${direction}, ${from}, ${to})` }}>
      {children}
    </span>
  )
}
