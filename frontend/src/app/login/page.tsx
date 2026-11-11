"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bebas_Neue } from "next/font/google";
import { API_URL, setSession, type AuthResponse } from "@/lib/api";
import styles from "./login.module.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginErrorResponse {
  message?: string | string[];
}

const INITIAL_CREDENTIALS: LoginCredentials = { email: "", password: "" };

export default function LoginPage() {
  const router = useRouter();

  const [credentials, setCredentials] =
    useState<LoginCredentials>(INITIAL_CREDENTIALS);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name as keyof LoginCredentials]: value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!credentials.email.trim() || !credentials.password) {
      setError("Completa correo y contraseña para continuar.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: credentials.email.trim(),
          password: credentials.password,
        }),
      });

      if (!res.ok) {
        const data: LoginErrorResponse = await res.json().catch(() => ({}));
        const message = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message;
        throw new Error(message ?? "Credenciales inválidas.");
      }

      const auth = (await res.json()) as AuthResponse;
      setSession(auth);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Ocurrió un error inesperado.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.glowTop} aria-hidden="true" />
      <div className={styles.glowBottom} aria-hidden="true" />

      <section className={styles.card} aria-labelledby="login-title">
        {/* ---------- Marca ---------- */}
        <header className={styles.brand}>
          <div className={styles.logo} aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="9" />
              <ellipse cx="12" cy="12" rx="4" ry="9" />
              <path d="M3 12h18" />
            </svg>
          </div>

          <p className={`${styles.brandName} ${bebas.className}`}>
            Sophia <span className={styles.brandAccent}>IA</span>
          </p>
          <p className={`${styles.slogan} ${bebas.className}`}>
            Tu empresa, impulsada por inteligencia artificial
          </p>
        </header>

        <div className={styles.divider} aria-hidden="true" />

        {/* ---------- Título del formulario ---------- */}
        <div className={styles.formHeader}>
          <h1 id="login-title" className={styles.title}>
            Iniciar sesión
          </h1>
          <p className={styles.subtitle}>
            Ingresa tus credenciales para continuar
          </p>
        </div>

        {/* ---------- Formulario ---------- */}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Correo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="tu@empresa.com"
              className={styles.input}
              value={credentials.email}
              onChange={handleChange}
              disabled={isLoading}
              aria-invalid={Boolean(error)}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Contraseña
            </label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className={`${styles.input} ${styles.inputPassword}`}
                value={credentials.password}
                onChange={handleChange}
                disabled={isLoading}
                aria-invalid={Boolean(error)}
                required
              />
              <button
                type="button"
                className={styles.toggle}
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isLoading}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                aria-pressed={showPassword}
              >
                {showPassword ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

          {error && (
            <p className={styles.error} role="alert">
              <span className={styles.errorIcon} aria-hidden="true">
                !
              </span>
              <span>{error}</span>
            </p>
          )}

          <button
            type="submit"
            className={styles.submit}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                Verificando…
              </>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>

        <footer className={styles.footer}>
          <span>¿No tienes una cuenta?</span>
          <Link href="/register" className={styles.link}>
            Crear cuenta
          </Link>
        </footer>
      </section>
    </main>
  );
}
