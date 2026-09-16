export default function AdminWorkspaceHeader({ icon: Icon, eyebrow, title, description, children, meta }) {
  return (
    <header className="relative mb-5 overflow-hidden rounded-[1.65rem] border border-noir/10 bg-gradient-to-br from-noir via-[#202027] to-noir px-5 py-5 shadow-[0_14px_34px_rgba(16,16,20,0.16)] sm:px-6">
      <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
      <div className="pointer-events-none absolute right-28 -bottom-20 h-36 w-36 rounded-full bg-gold/10 blur-2xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          {Icon && <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold text-noir shadow-lg shadow-black/20"><Icon className="h-5 w-5" /></div>}
          <div className="min-w-0">
            {eyebrow && <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">{eyebrow}</p>}
            <h1 className="truncate text-2xl font-bold tracking-tight text-ivory sm:text-3xl">{title}</h1>
            {description && <p className="mt-1 text-sm text-ivory/60">{description}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">{meta}{children}</div>
      </div>
    </header>
  )
}
