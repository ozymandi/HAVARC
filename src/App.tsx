import { Navigate, Route, Routes } from 'react-router-dom'
import { ChangePassword } from './pages/ChangePassword'
import { InvoiceEditor } from './pages/InvoiceEditor'
import { JobDetail } from './pages/JobDetail'
import { Jobs } from './pages/Jobs'
import { Login } from './pages/Login'
import { Settings } from './pages/Settings'
import { Splash } from './pages/Splash'
import { Step1 } from './pages/Step1'
import { Step2 } from './pages/Step2'
import { Step3 } from './pages/Step3'
import { Step4 } from './pages/Step4'

function App() {
  return (
    <div className="min-h-svh bg-surface-alt">
      <div className="relative mx-auto min-h-svh w-full max-w-[390px]">
        <Routes>
          <Route path="/splash" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/new" element={<Step1 />} />
          <Route path="/jobs/new/step-2" element={<Step2 />} />
          <Route path="/jobs/new/step-3" element={<Step3 />} />
          <Route path="/jobs/new/step-4" element={<Step4 />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/jobs/:id/invoice" element={<InvoiceEditor />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/change-password" element={<ChangePassword />} />
          <Route path="/" element={<Navigate to="/splash" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
