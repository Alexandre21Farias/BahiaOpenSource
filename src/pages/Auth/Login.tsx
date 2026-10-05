import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { SocialAuthButtons } from "../../components/auth/SocialAuthButtons";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

export function Login() {
  const navigate = useNavigate();
  const { user, loading: authLoading, authError } = useAuth();

  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (authError) {
      setError(translateError(authError));
    }
  }, [authError]);

  // Redireciona se o usuário já estiver autenticado
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/profile");
    }
  }, [user, authLoading, navigate]);

  const translateError = (message: string): string => {
    if (message.includes("Invalid login credentials")) {
      return "E-mail ou senha incorretos. Verifique seus dados.";
    }
    if (message.includes("Email not confirmed")) {
      return "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada ou spam.";
    }
    if (message.includes("Too many requests")) {
      return "Muitas tentativas consecutivas. Aguarde alguns minutos antes de tentar novamente.";
    }
    return message;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(translateError(signInError.message));
      } else {
        navigate("/profile");
      }
    } catch (err: any) {
      setError("Ocorreu um erro inesperado ao tentar entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(
        "Digite seu e-mail no campo acima para enviarmos o link de recuperação.",
      );
      return;
    }

    setResetLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/login`,
        },
      );

      if (resetError) {
        setError(translateError(resetError.message));
      } else {
        setSuccessMessage(
          "E-mail de recuperação enviado! Verifique sua caixa de entrada.",
        );
      }
    } catch (err: any) {
      setError("Não foi possível solicitar a recuperação de senha no momento.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-form-wrapper reveal">
      <h2>Acesse sua conta</h2>
      <p className="auth-subtitle">
        Bem-vindo de volta! Faça login para continuar na comunidade.
      </p>

      {error && (
        <div className="auth-error-alert" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div
          className="auth-error-alert"
          style={{
            background: "rgba(34, 197, 94, 0.15)",
            borderColor: "rgba(34, 197, 94, 0.35)",
            color: "#86efac",
          }}
          role="status"
        >
          <CheckCircle2 size={18} style={{ color: "#22c55e" }} />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <Input
          label="Email"
          type="email"
          placeholder="seu@email.com"
          icon={<Mail size={20} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          autoComplete="email"
          required
        />

        <Input
          label="Senha"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          icon={<Lock size={20} />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          autoComplete="current-password"
          required
          rightElement={
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Ocultar senha" : "Exibir senha"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        <div className="auth-actions">
          <label className="checkbox-label" style={{ cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Lembrar de mim
          </label>
          <a
            href="#forgot"
            onClick={handleForgotPassword}
            className="forgot-password"
            style={{ opacity: resetLoading ? 0.6 : 1 }}
          >
            {resetLoading ? "Enviando..." : "Esqueceu a senha?"}
          </a>
        </div>

        <Button fullWidth type="submit" isLoading={loading}>
          Entrar na Conta
        </Button>
      </form>

      {/* Opções de Login Social (GitHub & Discord) */}
      <SocialAuthButtons
        onError={(msg) => setError(msg ? translateError(msg) : null)}
        disabled={loading}
      />

      <p className="auth-footer">
        Não tem uma conta? <Link to="/register">Cadastre-se gratuitamente</Link>
      </p>
    </div>
  );
}
