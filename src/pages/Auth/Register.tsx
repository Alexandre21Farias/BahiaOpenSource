import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../../components/ui/icon";
import {
  User,
  EnvelopeSimple,
  LockKey,
  Code,
  ArrowRight,
  WarningCircle,
  Eye,
  EyeSlash,
  CheckCircle,
} from "@phosphor-icons/react";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { SocialAuthButtons } from "../../components/auth/SocialAuthButtons";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

export function Register() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Redireciona se o usuário já estiver autenticado
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/profile");
    }
  }, [user, authLoading, navigate]);

  const translateError = (message: string): string => {
    if (message.includes("User already registered")) {
      return "Este e-mail já está cadastrado. Faça login ou recupere sua senha.";
    }
    if (message.includes("Password should be at least")) {
      return "A senha deve conter no mínimo 6 caracteres.";
    }
    if (message.includes("invalid email")) {
      return "Por favor, insira um endereço de e-mail válido.";
    }
    return message;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);

    if (!name.trim()) {
      setError("Por favor, informe seu nome completo.");
      return;
    }

    if (!email.trim()) {
      setError("Por favor, informe um endereço de e-mail válido.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve possuir pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
          emailRedirectTo: `${window.location.origin}/profile`,
        },
      });

      if (signUpError) {
        setError(translateError(signUpError.message));
      } else if (data?.user && data.session === null) {
        // Se a confirmação de e-mail estiver ativa no Supabase
        setSuccessInfo(
          "Cadastro realizado! Enviamos um link de confirmação para o seu e-mail.",
        );
      } else {
        navigate("/profile");
      }
    } catch (err: any) {
      setError("Ocorreu um erro ao processar seu cadastro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-wrapper reveal">
      <h2>Crie sua conta</h2>
      <p className="auth-subtitle">
        Junte-se à maior comunidade open source da Bahia.
      </p>

      {error && (
        <div className="auth-error-alert" role="alert">
          <Icon icon={WarningCircle} size="md" />
          <span>{error}</span>
        </div>
      )}

      {successInfo && (
        <div
          className="auth-error-alert"
          style={{
            background: "rgba(34, 197, 94, 0.15)",
            borderColor: "rgba(34, 197, 94, 0.35)",
            color: "#86efac",
          }}
          role="status"
        >
          <Icon icon={CheckCircle} size="md" style={{ color: "#22c55e" }} />
          <span>{successInfo}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <Input
          label="Nome completo"
          type="text"
          placeholder="ex: Alexandre Farias"
          icon={<Icon icon={User} size="md" />}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          autoComplete="name"
          required
        />
        <Input
          label="Email"
          type="email"
          placeholder="seu@email.com"
          icon={<Icon icon={EnvelopeSimple} size="md" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          autoComplete="email"
          required
        />
        <Input
          label="Senha (mínimo 6 caracteres)"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          icon={<Icon icon={LockKey} size="md" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          autoComplete="new-password"
          required
          rightElement={
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Ocultar senha" : "Exibir senha"}
              tabIndex={-1}
            >
              {showPassword ? (
                <Icon icon={EyeSlash} size="md" />
              ) : (
                <Icon icon={Eye} size="md" />
              )}
            </button>
          }
        />

        <Button fullWidth type="submit" isLoading={loading}>
          Criar minha conta
        </Button>
      </form>

      {/* Opções de Cadastro Social (GitHub & Discord) */}
      <SocialAuthButtons
        onError={(msg) => setError(msg ? translateError(msg) : null)}
        disabled={loading}
      />

      <p className="auth-footer">
        Já tem uma conta? <Link to="/login">Fazer login</Link>
      </p>
    </div>
  );
}
