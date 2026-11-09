
import { useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Earth,
  LockKeyhole,
  Mail,
  User,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { api, type AuthUser } from '../services/api';

type LoginProps = {
  onLogin: (data: AuthUser) => void;
};

export default function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  function changeMode(nextMode: 'login' | 'register') {
    setMode(nextMode);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (mode === 'register') {
      if (password.length < 6) {
        setError('A senha deve possuir pelo menos 6 caracteres.');
        return;
      }

      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
      }
    }

    setBusy(true);

    try {
      if (mode === 'register') {
        await api.post('/auth/register', {
          name: name.trim(),
          email: email.trim(),
          password,
        });

        setSuccess('Conta criada com sucesso! Agora entre com seu e-mail e senha.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        setName('');
      } else {
        const { data } = await api.post('/auth/login', {
          email: email.trim(),
          password,
        });

        localStorage.setItem('calor_token', data.accessToken);
        onLogin(data.user);
      }
    } catch (err: any) {
      const message = err?.response?.data?.message;

      setError(
        Array.isArray(message)
          ? message.join(' ')
          : message || (
            mode === 'register'
              ? 'Não foi possível criar a conta. Verifique os dados e tente novamente.'
              : 'Não foi possível entrar. Confira a API e suas credenciais.'
          ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-art">
        <div className="login-brand">
          <Earth size={27} />
          <span>Calor em Contexto</span>
        </div>

        <div className="login-copy">
          <span className="eyebrow light">
            CIÊNCIA • DADOS • PLANETA
          </span>

          <h1>
            As mudanças deixam pistas.
            <br />
            <em>Vamos investigá-las.</em>
          </h1>

          <p>
            Explore tendências da temperatura da superfície terrestre
            e transforme dados ambientais em descobertas compreensíveis.
          </p>
        </div>

        <div className="login-foot">
          Uma plataforma de investigação ambiental.
        </div>
      </section>

      <section className="login-form-wrap">
        <form className="login-form" onSubmit={submit}>
          <div className="mobile-logo">
            <Earth />
            Calor em Contexto
          </div>

          <span className="eyebrow">ÁREA DA PLATAFORMA</span>

          <h2>
            {mode === 'login' ? 'Bem-vinda de volta' : 'Crie sua conta'}
          </h2>

          <p className="muted">
            {mode === 'login'
              ? 'Entre para explorar os dados e as tendências.'
              : 'Cadastre-se para acessar a plataforma.'}
          </p>

          {mode === 'register' && (
            <>
              <label htmlFor="name">Nome completo</label>

              <div className="input-wrap">
                <User size={18} />

                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            </>
          )}

          <label htmlFor="email">E-mail</label>

          <div className="input-wrap">
            <Mail size={18} />

            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              required
            />
          </div>

          <label htmlFor="password">Senha</label>

          <div className="input-wrap">
            <LockKeyhole size={18} />

            <input
              id="password"
              type="password"
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              minLength={6}
              required
            />
          </div>

          {mode === 'register' && (
            <>
              <label htmlFor="confirmPassword">Confirmar senha</label>

              <div className="input-wrap">
                <LockKeyhole size={18} />

                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite a senha novamente"
                  minLength={6}
                  required
                />
              </div>
            </>
          )}

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message" role="status">
              {success}
            </div>
          )}

          <button
            className="primary-button full"
            type="submit"
            disabled={busy}
          >
            {busy
              ? mode === 'login' ? 'Entrando...' : 'Criando conta...'
              : mode === 'login' ? 'Entrar na plataforma' : 'Criar minha conta'}

            {mode === 'login'
              ? <ArrowRight size={17} />
              : <UserPlus size={17} />}
          </button>

          <div className="login-hint">
            {mode === 'login'
              ? 'Ainda não possui uma conta?'
              : 'Já possui uma conta?'}
          </div>

          <button
            type="button"
            className="auth-switch-button"
            onClick={() => changeMode(
              mode === 'login' ? 'register' : 'login',
            )}
          >
            {mode === 'login' ? (
              <>
                <UserPlus size={16} />
                Criar conta
              </>
            ) : (
              <>
                <LogIn size={16} />
                Voltar para o login
              </>
            )}
          </button>

          {mode === 'register' && (
            <p className="login-hint">
              O cadastro cria uma conta com perfil de Usuário.
            </p>
          )}
        </form>
      </section>
    </main>
  );
}
