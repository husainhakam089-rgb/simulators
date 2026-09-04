import { Suspense, lazy, useEffect } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { startAutoSync } from "./lib/sync";
import Login from "./screens/Login";
import Signup from "./screens/Signup";
import Scan from "./screens/worker/Scan";
import AdminLayout from "./screens/admin/AdminLayout";
import Dashboard from "./screens/admin/Dashboard";
import Alerts from "./screens/admin/Alerts";

// شاشات المدير الأقل استعمالاً تُحمَّل عند فتحها — الاستيراد يجرّ مكتبة Excel كبيرة
const Review = lazy(() => import("./screens/admin/Review"));
const Categories = lazy(() => import("./screens/admin/Categories"));
const Import = lazy(() => import("./screens/admin/Import"));
const Compliance = lazy(() => import("./screens/admin/Compliance"));
const Team = lazy(() => import("./screens/admin/Team"));

const Loading = <div className="empty">لحظة…</div>;

function Routing() {
  const { session, profile, loading } = useAuth();

  useEffect(() => startAutoSync(), []);

  if (loading) return <div className="center-screen"><div className="muted">لحظة…</div></div>;

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (!profile) {
    return (
      <div className="center-screen">
        <div className="card auth-card center">
          <h1>حسابك غير مرتبط بمحل</h1>
          <p className="muted">راجع مدير المحل.</p>
        </div>
      </div>
    );
  }

  // العامل لا يرى شيئاً غير الكاميرا
  if (profile.role === "worker") {
    return (
      <Routes>
        <Route path="/scan" element={<Scan />} />
        <Route path="*" element={<Navigate to="/scan" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/scan" element={<Scan />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="review" element={<Suspense fallback={Loading}><Review /></Suspense>} />
        <Route path="categories" element={<Suspense fallback={Loading}><Categories /></Suspense>} />
        <Route path="import" element={<Suspense fallback={Loading}><Import /></Suspense>} />
        <Route path="compliance" element={<Suspense fallback={Loading}><Compliance /></Suspense>} />
        <Route path="team" element={<Suspense fallback={Loading}><Team /></Suspense>} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routing />
      </AuthProvider>
    </HashRouter>
  );
}
