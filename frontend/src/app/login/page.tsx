'use client';

import { DM_Sans, Syne } from 'next/font/google';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api, AuthResponse, setSession } from '@/lib/api';
import styles from '../auth.module.css';

const syne = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-auth-display',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-auth-body',
});

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
    <main className={`${styles.page} ${syne.variable} ${dmSans.variable}`}>
      <div className={styles.shell}>
        <section className={styles.visual}>
          <div className={styles.visualGlow} aria-hidden="true" />
          <p className={styles.visualBrand}>AtlasIA</p>
          <div className={styles.visualCopy}>
            <p className={styles.visualEyebrow}>Tu empresa, un agente</p>
            <h1 className={styles.visualHeadline}>
              Accede al hub donde tu conocimiento responde solo
            </h1>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelInner}>
            <header className={styles.panelHeader}>
              <p className={styles.panelMark}>AtlasIA</p>
              <h2 className={styles.panelTitle}>Iniciar sesión</h2>
              <p className={styles.panelSupport}>
                Entrá al panel para configurar agentes, documentos y tu widget.
              </p>
            </header>

            <form className={styles.form} onSubmit={onSubmit} noValidate>
              <label className={styles.field}>
                <span>Tu correo</span>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="tu@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label className={styles.field}>
                <span>Contraseña</span>
                <div className={styles.passwordRow}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Mínimo 8 caracteres"
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
              ¿No tienes cuenta?{' '}
              <Link href="/register" className={styles.footerLink}>
                Crear cuenta
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
