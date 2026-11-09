
import { useEffect, useRef, useState } from 'react';
import { UserRound, ShieldCheck, Camera, Trash2 } from 'lucide-react';

import { api, type AuthUser } from '../services/api';

type ProfileProps = {
  user: AuthUser;
  avatar: string | null;
  onAvatarChange: (avatar: string | null) => void;
};

export default function Profile({
  user,
  avatar,
  onAvatarChange,
}: ProfileProps) {
  const [details, setDetails] = useState<AuthUser>(user);
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/auth/me')
      .then((response) => {
        if (response.data) {
          setDetails(response.data);
        }
      })
      .catch(() => {
        setError(
          'Não foi possível atualizar os dados do perfil. Exibindo os dados da sessão.',
        );
      });
  }, []);

  function handlePhotoChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setPhotoError('');

    if (!file.type.startsWith('image/')) {
      setPhotoError('Selecione um arquivo de imagem válido.');
      event.target.value = '';
      return;
    }

    if (file.size > 1024 * 1024) {
      setPhotoError('A imagem deve ter no máximo 1 MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onAvatarChange(reader.result);
      }
    };

    reader.onerror = () => {
      setPhotoError('Não foi possível carregar a imagem.');
    };

    reader.readAsDataURL(file);
    event.target.value = '';
  }

  function removePhoto() {
    onAvatarChange(null);
    setPhotoError('');
  }

  const roleName =
    details.role === 'ADMIN'
      ? 'Administrador'
      : 'Usuário';

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">CONTA E SEGURANÇA</div>
          <h1>Meu perfil</h1>
          <p>
            Informações da conta autenticada na plataforma.
          </p>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <section className="panel profile-panel">
        <div
          className="profile-avatar"
          style={{
            position: 'relative',
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
            <UserRound size={32} />
          )}
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            margin: '16px 0',
          }}
        >
          <button
            type="button"
            className="primary-button"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera size={16} />
            Escolher foto
          </button>

          {avatar && (
            <button
              type="button"
              className="icon-button"
              onClick={removePhoto}
              title="Remover foto"
              aria-label="Remover foto do perfil"
            >
              <Trash2 size={17} />
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          style={{ display: 'none' }}
        />

        <p className="chart-footnote">
          Escolha uma imagem de até 1 MB. A foto ficará salva neste navegador.
        </p>

        {photoError && (
          <div className="error-banner">
            {photoError}
          </div>
        )}

        <h2>{details.name || 'Usuário'}</h2>

        <p className="muted">
          {details.email || 'E-mail não informado'}
        </p>

        <div className="profile-details">
          <div>
            <span>Nome</span>
            <strong>{details.name || '—'}</strong>
          </div>

          <div>
            <span>E-mail</span>
            <strong>{details.email || '—'}</strong>
          </div>

          <div>
            <span>Perfil de acesso</span>
            <strong>{roleName}</strong>
          </div>

          <div>
            <span>Segurança</span>
            <strong>
              <ShieldCheck size={15} />
              Autenticação JWT
            </strong>
          </div>
        </div>

        <p className="chart-footnote">
          Os dados da conta são carregados da sessão autenticada.
          A foto de perfil é armazenada localmente no navegador.
        </p>
      </section>
    </div>
  );
}
