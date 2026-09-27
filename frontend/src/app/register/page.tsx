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

export default function RegisterPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
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
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({ companyName, adminName, email, password }),
        },
        false,
      );
      setSession(auth);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`${styles.page} ${syne.variable} ${dmSans.variable}`}>
      <div className={`${styles.shell} ${styles.shellWide}`}>
        <section className={styles.visual}>
          <div className={styles.visualGlow} aria-hidden="true" />
          <p className={styles.visualBrand}>AtlasIA</p>
          <div className={styles.visualCopy}>
            <p className={styles.visualEyebrow}>Empieza gratis</p>
            <h1 className={styles.visualHeadline}>
              Crea tu cuenta y deja que tu negocio responda solo
            </h1>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelInner}>
            <header className={styles.panelHeader}>
              <p className={styles.panelMark}>AtlasIA</p>
              <h2 className={styles.panelTitle}>Crear cuenta</h2>
              <p className={styles.panelSupport}>
                Registra tu empresa y arranca el onboarding en minutos.
              </p>
            </header>

            <form className={styles.form} onSubmit={onSubmit} noValidate>
              <label className={styles.field}>
                <span>Empresa</span>
                <input
                  autoComplete="organization"
                  placeholder="Nombre de tu empresa"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </label>

              <label className={styles.field}>
                <span>Tu nombre</span>
                <input
                  autoComplete="name"
                  placeholder="Nombre del administrador"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
                />
              </label>

              <label className={styles.field}>
                <span>Correo</span>
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
                    autoComplete="new-password"
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
                {loading ? 'Creando…' : 'Comenzar gratis'}
              </button>
            </form>

            <p className={styles.footer}>
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className={styles.footerLink}>
                Iniciar sesión
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
