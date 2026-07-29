/**
 * Section — consistent storefront section wrapper with an optional
 * eyebrow + serif heading + gold hairline divider.
 */
export function SectionHeading({ eyebrow, title, description, align = 'left', className = '' }) {
  return (
    <div className={`${align === 'center' ? 'text-center mx-auto' : ''} max-w-2xl ${className}`}>
      {eyebrow && (
        <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-gold-dark mb-3">
          {eyebrow}
        </span>
      )}
      <h2 className="font-serif text-3xl md:text-4xl font-bold text-ink leading-tight">{title}</h2>
      {description && <p className="mt-3 text-stone leading-relaxed">{description}</p>}
      <div className={`divider-gold mt-5 ${align === 'center' ? 'mx-auto w-24' : 'w-24'}`} />
    </div>
  )
}

export default function Section({ children, className = '', id }) {
  return (
    <section id={id} className={`py-14 md:py-20 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  )
}
