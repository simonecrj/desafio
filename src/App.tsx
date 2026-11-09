
import { useEffect, useState } from 'react';
import { Bell, HelpCircle } from 'lucide-react';

import { api, type AuthUser } from './services/api';
import WorldMapPage from './pages/WorldMapPage';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DataSources from './pages/DataSources';
import Countries from './pages/Countries';
import NasaExplorer from './pages/NasaExplorer';
import Regions from './pages/Regions';
import Measurements from './pages/Measurements';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import AccessibilityTools from './components/AccessibilityTools';

const AVATAR_STORAGE_KEY = 'ctrlclima_avatar';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [page, setPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  const [avatar, setAvatar] = useState<string | null>(() => {
    return localStorage.getItem(AVATAR_STORAGE_KEY);
  });

  function updateAvatar(newAvatar: string | null) {
    if (newAvatar) {
      localStorage.setItem(AVATAR_STORAGE_KEY, newAvatar);
    } else {
      localStorage.removeItem(AVATAR_STORAGE_KEY);
    }

    setAvatar(newAvatar);
  }

  useEffect(() => {
    async function checkSession() {
      const token = localStorage.getItem('calor_token');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');

        setUser(data);
        localStorage.setItem('calor_user', JSON.stringify(data));
      } catch {
        localStorage.removeItem('calor_token');
        localStorage.removeItem('calor_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, []);

  function onLogin(data: AuthUser) {
    localStorage.setItem('calor_user', JSON.stringify(data));
    setUser(data);
    setPage('dashboard');
  }

  function logout() {
    localStorage.removeItem('calor_token');
    localStorage.removeItem('calor_user');
    setUser(null);
    setPage('dashboard');
  }

  if (loading) {
    return (
      <div className="login-page">
        <p>Verificando sua sessão...</p>
        <AccessibilityTools />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Login onLogin={onLogin} />
        <AccessibilityTools />
      </>
    );
  }

  let content;

  if (page === 'data') {
    content = <DataSources />;
  } else if (page === 'countries') {
    content = <Countries />;
  } else if (page === 'nasa') {
    content = <NasaExplorer />;
  } else if (page === 'regions') {
    content = <Regions />;
  } else if (page === 'measurements') {
    content = <Measurements />;
  } else if (page === 'profile') {
    content = (
      <Profile
        user={user}
        avatar={avatar}
        onAvatarChange={updateAvatar}
      />
    );
  } else if (page === 'reports') {
    content = <Reports user={user} />;
  } else if (page === 'world-map') {
    content = <WorldMapPage />;
  } else {
    content = <Dashboard page={page} />;
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo principal
      </a>

      <div className="app-shell">
        <Sidebar
          page={page}
          setPage={setPage}
          user={user}
          logout={logout}
          avatar={avatar}
        />

        <main
          className="main-area"
          id="main-content"
          tabIndex={-1}
        >
          <header className="topbar">
            <div>
              <span className="topbar-label">
                PAINEL DE INVESTIGAÇÃO
              </span>

              <span className="topbar-sub">
                Dados para compreender as mudanças da Terra
              </span>
            </div>

            <div className="topbar-actions">
              <button
                className="icon-button"
                title="Ajuda"
                onClick={() =>
                  window.open(
                    'https://www.earthdata.nasa.gov/',
                    '_blank',
                    'noopener,noreferrer',
                  )
                }
              >
                <HelpCircle size={19} />
              </button>

              <button
                className="icon-button"
                title="Fontes de dados"
                onClick={() => setPage('data')}
              >
                <Bell size={18} />
              </button>

              <button
                type="button"
                className="topbar-avatar"
                title="Abrir meu perfil"
                aria-label="Abrir meu perfil"
                onClick={() => setPage('profile')}
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
                  (user.name || 'P').slice(0, 1).toUpperCase()
                )}
              </button>
            </div>
          </header>

          {content}

          <footer className="footer">
            <span>CtrlClima · Calor em Contexto</span>

            <span>
              Verifique fontes, unidades e limitações antes de conclusões científicas.
            </span>
          </footer>
        </main>
      </div>

      <AccessibilityTools />
    </>
  );
}
