import { Navigate, Route, Routes } from 'react-router-dom'
import { ChangePassword } from './pages/ChangePassword'
import { CheckEmail } from './pages/CheckEmail'
import { ForgotPassword } from './pages/ForgotPassword'
import { InvoiceEditorPage } from './pages/InvoiceEditor'
import { JobDetail } from './pages/JobDetail'
import { Jobs } from './pages/Jobs'
import { Login } from './pages/Login'
import { PdfPreview } from './pages/PdfPreview'
import { Settings } from './pages/Settings'
import { SetNewPassword } from './pages/SetNewPassword'
import { Splash } from './pages/Splash'
import { Step1 } from './pages/Step1'
import { Step2 } from './pages/Step2'
import { Step3 } from './pages/Step3'
import { Step4 } from './pages/Step4'

function App() {
  return (
    <div className="min-h-svh bg-surface-alt">
      {/* Full width on every device: phones stretch to their own width, and from 768px up
          each screen switches to its desktop layout (Figma 320:3662) with the content
          column capped at 1440px via the `app-col` utility, headers/footers full-bleed. */}
      <div className="relative min-h-svh w-full">
        <Routes>
          <Route path="/splash" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/forgot-password/check-email" element={<CheckEmail />} />
          <Route path="/reset-password" element={<SetNewPassword />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/new" element={<Step1 />} />
          <Route path="/jobs/new/step-2" element={<Step2 />} />
          <Route path="/jobs/new/step-3" element={<Step3 />} />
          <Route path="/jobs/new/step-4" element={<Step4 />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/jobs/:id/invoice" element={<InvoiceEditorPage />} />
          <Route path="/jobs/:id/invoice/pdf" element={<PdfPreview kind="invoice" />} />
          <Route path="/jobs/:id/report" element={<PdfPreview kind="report" />} />
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
