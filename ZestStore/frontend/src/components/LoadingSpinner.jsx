export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sz = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8'
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`${sz} animate-spin border-4 border-blue-600 border-t-transparent rounded-full`} />
    </div>
  )
}
