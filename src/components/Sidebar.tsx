
import {
    Activity,
    BarChart3,
    Database,
    Earth,
    LogOut,
    ShieldCheck,
    Globe2,
    CloudSun,
    MapPinned,
    ClipboardList,
    UserRound,
    FileText,
    Settings,
  } from 'lucide-react';
  
  import type { AuthUser } from '../services/api';
  
  type SidebarProps = {
    page: string;
    setPage: (page: string) => void;
    user: AuthUser;
    logout: () => void;
    avatar: string | null;
  };
  
  export default function Sidebar({
    page,
    setPage,
    user,
    logout,
    avatar,
  }: SidebarProps) {
    const isAdmin = user.role === 'ADMIN';
  
    const items = [
      { id: 'dashboard', label: 'Visão geral', icon: Activity },
      { id: 'trends', label: 'Tendências', icon: BarChart3 },
      { id: 'regions', label: 'Regiões', icon: MapPinned },
      { id: 'measurements', label: 'Medições', icon: ClipboardList },
      { id: 'reports', label: 'Relatórios', icon: FileText },
      { id: 'nasa', label: 'Explorador NASA', icon: CloudSun },
      { id: 'countries', label: 'Países do mundo', icon: Globe2 },
      { id: 'world-map', label: 'Mapa Mundial', icon: Earth },
      { id: 'data', label: 'Dados e fontes', icon: Database },
      { id: 'profile', label: 'Meu perfil', icon: UserRound },
    ];
  
    return (
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Earth size={24} />
          </div>
  
          <div>
            <strong>CtrlClima</strong>
            <small>Calor em Contexto</small>
          </div>
        </div>
  
        <div className="nav-label">PLATAFORMA</div>
  
        <nav aria-label="Navegação principal">
          {items.map((item) => {
            const Icon = item.icon;
  
            return (
              <button
                key={item.id}
                className={`nav-item ${
                  page === item.id ? 'active' : ''
                }`}
                onClick={() => setPage(item.id)}
                title={item.label}
                aria-current={page === item.id ? 'page' : undefined}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
  
          {isAdmin && (
            <>
              <div className="nav-label admin-nav-label">
                ADMINISTRAÇÃO
              </div>
  
              <button
                className={`nav-item ${
                  page === 'admin' ? 'active' : ''
                }`}
                onClick={() => setPage('admin')}
              >
                <Settings size={18} />
                <span>Gerenciar sistema</span>
              </button>
            </>
          )}
        </nav>
  
        <div className="sidebar-bottom">
          <div className="secure-note">
            <ShieldCheck size={17} />
  
            <span>
              Ambiente protegido
              <br />
              <small>Autenticação JWT</small>
            </span>
          </div>
  
          <div className="user-chip">
            <button
              type="button"
              className="user-profile-button"
              onClick={() => setPage('profile')}
              title="Abrir meu perfil"
            >
              <div
                className="avatar"
                style={{
                  overflow: 'hidden',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Foto do perfil"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  (user.name || 'U').slice(0, 1).toUpperCase()
                )}
              </div>
  
              <div className="user-info">
                <strong>{user.name || 'Usuário'}</strong>
  
                <small>
                  {isAdmin ? 'Administrador' : 'Usuário'}
                </small>
              </div>
            </button>
  
            <button
              className="icon-button"
              title="Sair"
              aria-label="Sair da plataforma"
              onClick={logout}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
    );
  }
  