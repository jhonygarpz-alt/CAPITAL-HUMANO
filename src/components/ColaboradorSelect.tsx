import { useStore } from '../store/Store'
import { nombreCompleto } from '../lib/utils'
import { Select } from './ui'

export function ColaboradorSelect({ value, onChange, incluirBajas, required }: { value: string; onChange: (id: string) => void; incluirBajas?: boolean; required?: boolean }) {
  const { deEmpresa } = useStore()
  const lista = deEmpresa('colaboradores')
    .filter((c) => incluirBajas || c.estatus !== 'Baja')
    .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b)))
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} required={required}>
      <option value="">Selecciona un colaborador…</option>
      {lista.map((c) => (
        <option key={c.id} value={c.id}>{nombreCompleto(c)} · {c.puesto}</option>
      ))}
    </Select>
  )
}

export function useColaboradorMap() {
  const { db } = useStore()
  return new Map(db.colaboradores.map((c) => [c.id, c]))
}
