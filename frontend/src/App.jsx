import { useState } from 'react';
import useAuth from './hooks/useAuth';
import Login from './pages/user/login';
import Signup from './pages/user/signup';
import Dashboard from './pages/user/Dashboard';
import SuperAdminDashboard from './pages/user/SuperAdminDashboard';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DefualtProtectedRouter from './protectRouter/DefualtProtectedRouter';
import ProtectedRoute from './protectRouter/ProtectedRoute';
import { AuthProvider } from './Context/Authcontext';


function App() {
  

        return (
<AuthProvider>
    <BrowserRouter>


      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route element={<DefualtProtectedRouter />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
        
        {/* Protected User Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/user/dashboard" element={<Dashboard />} />
          <Route path="/superadmin" element={<SuperAdminDashboard />} />
        </Route>
      </Routes>





      </BrowserRouter>
    </AuthProvider>
        );
}

        export default App;


