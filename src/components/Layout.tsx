import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Store, 
  ClipboardCheck, 
  GraduationCap, 
  FileText, 
  FolderOpen,
  Users,
  LogOut
} from 'lucide-react';
import './Layout.css';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };


  const navItems = [
    { to: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { to: "/unidades", icon: <Store size={20} />, label: "Unidades" },
    { to: "/vistorias", icon: <ClipboardCheck size={20} />, label: "Vistorias" },
    { to: "/treinamentos", icon: <GraduationCap size={20} />, label: "Treinamentos" },
    { to: "/relatorios", icon: <FileText size={20} />, label: "Relatórios" },
    { to: "/documentacao", icon: <FolderOpen size={20} />, label: "Documentação" },
  ];

  if (isAdmin) {
    navItems.push({ to: "/usuarios", icon: <Users size={20} />, label: "Usuários" });
  }

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <h2 className="logo-text">Nutri<span className="logo-highlight">Joaq</span></h2>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink 
              key={item.to} 
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer" style={{flexDirection: 'column', gap: '0.75rem', alignItems: 'stretch'}}>
          <div className="user-info" style={{justifyContent: 'space-between', display: 'flex', width: '100%'}}>
            <div className="flex gap-2 items-center">
              <div className="user-avatar">{user?.name.charAt(0)}</div>
              <div className="user-details">
                <span className="user-name">{user?.name}</span>
                <span className="user-role">{user?.role === 'admin' ? 'Administrador' : 'Visualizador'}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-btn" title="Sair" style={{marginLeft: 'auto'}}>
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <div className="breadcrumb">
             Bem-vindo ao Nutri Joaq, {user?.name.split(' ')[0]}
          </div>
        </div>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
