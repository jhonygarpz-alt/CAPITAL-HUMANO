import { HashRouter, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './store/Store'
import Layout from './components/Layout'
import Inicio from './pages/Inicio'
import Colaboradores from './pages/Colaboradores'
import ColaboradorDetalle from './pages/ColaboradorDetalle'
import Expedientes from './pages/Expedientes'
import Contratos from './pages/Contratos'
import Nomina, { NominaDetalle } from './pages/Nomina'
import Asistencias from './pages/Asistencias'
import Vacaciones from './pages/Vacaciones'
import Incidencias from './pages/Incidencias'
import Vacantes from './pages/Vacantes'
import Reportes from './pages/Reportes'
import Configuracion from './pages/Configuracion'
import Ayuda from './pages/Ayuda'
import { Empty } from './components/ui'

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Inicio />} />
            <Route path="colaboradores" element={<Colaboradores />} />
            <Route path="colaboradores/:id" element={<ColaboradorDetalle />} />
            <Route path="expedientes" element={<Expedientes />} />
            <Route path="contratos" element={<Contratos />} />
            <Route path="nomina" element={<Nomina />} />
            <Route path="nomina/:id" element={<NominaDetalle />} />
            <Route path="asistencias" element={<Asistencias />} />
            <Route path="vacaciones" element={<Vacaciones />} />
            <Route path="incidencias" element={<Incidencias />} />
            <Route path="vacantes" element={<Vacantes />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="configuracion" element={<Configuracion />} />
            <Route path="ayuda" element={<Ayuda />} />
            <Route path="*" element={<Empty title="Página no encontrada" />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  )
}
