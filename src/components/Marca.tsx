/** Logotipo de Optima Dual Solutions (vectorial, se ve nítido en cualquier tamaño). */
export function LogoOptima({ size = 44, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`shrink-0 ${className}`} role="img" aria-label="Optima Dual Solutions">
      <rect width="100" height="100" rx="12" fill="#fff" />
      <ellipse cx="42" cy="84" rx="32" ry="7" fill="#c9d3da" opacity=".6" />
      <path d="M58 25 A28 28 0 1 1 22.6 43.3" fill="none" stroke="#064467" strokeWidth="12" strokeLinecap="round" />
      <path d="M36 12 L50 42" stroke="#7CC142" strokeWidth="10" strokeLinecap="round" />
      <path d="M84 86 L94 86" stroke="#7CC142" strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}

/** Logotipo + nombre de la empresa. */
export function Marca({ size = 44, claro = true, subtitulo }: { size?: number; claro?: boolean; subtitulo?: string }) {
  return (
    <div className="flex items-center gap-3">
      <LogoOptima size={size} className="ring-2 ring-white/20 rounded-xl" />
      <div className="leading-tight">
        <div className={`font-marca text-[21px] font-extrabold tracking-tight ${claro ? 'text-white' : 'text-primary-600'}`}>Optima Dual Solutions</div>
        {subtitulo && <div className={`text-[13px] ${claro ? 'text-white/80' : 'text-slate-500'}`}>{subtitulo}</div>}
      </div>
    </div>
  )
}

/** Logotipo de una empresa del sistema; si no tiene, muestra sus iniciales con su color. */
export function LogoEmpresa({ empresa, size = 36, className = '' }: { empresa: { nombre: string; logo?: string; color?: string }; size?: number; className?: string }) {
  if (empresa.logo) {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-0.5 ring-1 ring-black/5 ${className}`} style={{ width: size, height: size }}>
        <img src={empresa.logo} alt={`Logo de ${empresa.nombre}`} className="max-h-full max-w-full object-contain" />
      </span>
    )
  }
  const ini = empresa.nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-lg font-bold text-white ${className}`} style={{ width: size, height: size, background: empresa.color || '#064467', fontSize: size * 0.38 }}>
      {ini || '?'}
    </span>
  )
}
