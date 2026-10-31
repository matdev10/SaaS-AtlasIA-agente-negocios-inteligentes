'use client';

import { Bebas_Neue, DM_Sans } from 'next/font/google';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api, AuthResponse, setSession } from '@/lib/api';
import styles from './login.module.css';

const bebas = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-login-display',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-login-body',
});

const globe = (
  <svg viewBox="0 0 160 160" fill="none" aria-hidden="true">
    <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="80" cy="80" r="70" />
      <ellipse cx="80" cy="80" rx="48" ry="70" />
      <ellipse cx="80" cy="80" rx="26" ry="70" />
      <line x1="80" y1="10" x2="80" y2="150" />
      <ellipse cx="80" cy="80" rx="70" ry="16" />
      <ellipse cx="80" cy="80" rx="70" ry="40" />
    </g>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const auth = await api<AuthResponse>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        },
        false,
      );
      setSession(auth);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`${styles.page} ${bebas.variable} ${dmSans.variable}`}>
      <div className={styles.stage}>
        <section className={styles.brand} aria-label="Sophia IA">
          <div className={styles.logo}>
            <p className={styles.sophia}>Sophia</p>
            <div className={styles.globe}>{globe}</div>
            <p className={styles.ia}>IA</p>
          </div>
          <div className={styles.brandFoot}>
            <p className={styles.brandEyebrow}>Tu empresa, un agente</p>
            <p className={styles.brandHeadline}>
              Accede al hub donde tu conocimiento responde solo
            </p>
          </div>
        </section>

        <section className={styles.formSide}>
          <header className={styles.formHeader}>
            <p className={styles.mark}>Sophia IA</p>
            <h1 className={styles.title}>Iniciar sesión</h1>
            <p className={styles.support}>
              Entrá al panel para configurar agentes, documentos y tu widget.
            </p>
          </header>

          <form className={styles.form} onSubmit={onSubmit} noValidate>
            <label className={styles.field}>
              <span>Tu correo</span>
              <input
                type="email"
                placeholder="tu@empresa.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Tu contraseña</span>
              <div className={styles.passwordRow}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </label>

            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : null}

            <button className={styles.submit} type="submit" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <p className={styles.footer}>
            ¿No tienes cuenta? <Link href="/register">Crear cuenta</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
