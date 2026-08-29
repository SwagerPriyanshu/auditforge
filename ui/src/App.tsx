import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./layout/AppLayout";
import { LandingPage } from "./pages/LandingPage";
import { HomePage } from "./pages/HomePage";
import { InvestigationPage } from "./pages/InvestigationPage";
import { AuditPage } from "./pages/AuditPage";
import { ReplayPage } from "./pages/ReplayPage";
import { EvidencePage } from "./pages/EvidencePage";
import { AttestationPage } from "./pages/AttestationPage";
import { HarnessPage } from "./pages/HarnessPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* SaaS Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* App Workspace Routes */}
        <Route
          path="/app"
          element={
            <AppLayout>
              <HomePage />
            </AppLayout>
          }
        />
        <Route
          path="/investigations/:id"
          element={
            <AppLayout>
              <InvestigationPage />
            </AppLayout>
          }
        />
        <Route
          path="/audit"
          element={
            <AppLayout>
              <AuditPage />
            </AppLayout>
          }
        />
        <Route
          path="/audit/:id"
          element={
            <AppLayout>
              <AuditPage />
            </AppLayout>
          }
        />
        <Route
          path="/replay"
          element={
            <AppLayout>
              <ReplayPage />
            </AppLayout>
          }
        />
        <Route
          path="/replay/:id"
          element={
            <AppLayout>
              <ReplayPage />
            </AppLayout>
          }
        />
        <Route
          path="/evidence"
          element={
            <AppLayout>
              <EvidencePage />
            </AppLayout>
          }
        />
        <Route
          path="/evidence/:id"
          element={
            <AppLayout>
              <EvidencePage />
            </AppLayout>
          }
        />
        <Route
          path="/attestation"
          element={
            <AppLayout>
              <AttestationPage />
            </AppLayout>
          }
        />
        <Route
          path="/attestation/:id"
          element={
            <AppLayout>
              <AttestationPage />
            </AppLayout>
          }
        />
        <Route
          path="/harness"
          element={
            <AppLayout>
              <HarnessPage />
            </AppLayout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
