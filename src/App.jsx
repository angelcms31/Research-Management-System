// Route table. Everything inside <Shell> requires a signed-in user and is role-checked there.
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Shell from './components/Layout.jsx';
import { ForgotPassword, Login } from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import RecordsRoute, { RecordFormPage } from './pages/Records.jsx';
import RecordDetail from './pages/RecordDetail.jsx';
import Reports from './pages/Reports.jsx';
import Repository from './pages/Repository.jsx';
import Maintenance from './pages/Maintenance.jsx';
import Admin from './pages/Admin.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route element={<Shell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/records/:type" element={<RecordsRoute />} />
        <Route path="/records/:type/new" element={<RecordFormPage />} />
        <Route path="/records/:type/:id" element={<RecordDetail />} />
        <Route path="/records/:type/:id/edit" element={<RecordFormPage />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/:id" element={<Reports />} />
        <Route path="/repository" element={<Repository />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/maintenance/:entity" element={<Maintenance />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/:section" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
