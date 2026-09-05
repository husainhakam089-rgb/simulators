import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../lib/auth";

const TABS = [
  { to: "/admin", label: "اللوحة", end: true },
  { to: "/admin/alerts", label: "يحتاج قراراً" },
  { to: "/admin/review", label: "المراجعة" },
  { to: "/admin/categories", label: "أعمار المجموعات" },
  { to: "/admin/import", label: "استيراد الأصناف" },
  { to: "/admin/compliance", label: "الالتزام" },
  { to: "/admin/team", label: "الطاقم" },
];

export default function AdminLayout() {
  const { profile, storeName, signOut } = useAuth();

  return (
    <div className="app">
      <div className="topbar">
        <h1>
          {storeName ?? "المحل"}
          <div className="sub">{profile?.name}</div>
        </h1>
        <button onClick={() => void signOut()}>خروج</button>
      </div>

      <nav className="tabs">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end}
                   className={({ isActive }) => (isActive ? "active" : "")}>
            {t.label}
          </NavLink>
        ))}
      </nav>

      <div className="page"><Outlet /></div>
    </div>
  );
}
