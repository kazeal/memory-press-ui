import React from 'react';
import StartAR from './components/startAR';
import CreateMemory from './components/CreateMemory';
import EditMemory from './components/EditMemory';
import AdminList from './components/AdminList';
import AdminLogin from './components/AdminLogin';
import RequireAuth from './components/RequireAuth';
import ViewMemory from './components/ViewMemory';
import ScanPrompt from './components/ScanPrompt';

import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';

// Old QR codes/links point at /ar/:id — keep them working forever.
function LegacyArRedirect() {
  const { id } = useParams();
  return <Navigate to={`/view/${id}`} replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StartAR />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminList />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/upload"
          element={
            <RequireAuth>
              <CreateMemory />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/edit/:id"
          element={
            <RequireAuth>
              <EditMemory />
            </RequireAuth>
          }
        />
        <Route path="/view" element={<ScanPrompt />} />
        <Route path="/view/:id" element={<ViewMemory />} />
        <Route path="/ar" element={<Navigate to="/view" replace />} />
        <Route path="/ar/:id" element={<LegacyArRedirect />} />
      </Routes>
    </Router>
  );
}

export default App;
