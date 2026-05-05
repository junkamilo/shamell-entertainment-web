"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import {
  BadgeCheck,
  KeyRound,
  Lock,
  Mail,
  RotateCcw,
  Send,
  User,
  UserPlus,
} from "lucide-react";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Phase = 1 | 2;

export default function ShamellAdminAgregarAdminPage() {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
    [],
  );

  const [phase, setPhase] = useState<Phase>(1);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const parseErrorMessage = useCallback((data: unknown, fallback: string) => {
    if (typeof data !== "object" || data === null) return fallback;
    const payload = data as { message?: string | string[] };
    if (Array.isArray(payload.message)) return payload.message.join(", ");
    return payload.message ?? fallback;
  }, []);

  const resetFlow = () => {
    setPhase(1);
    setEmail("");
    setFullName("");
    setCode("");
    setPassword("");
  };

  const sendVerificationCode = useCallback(
    async (isResend = false) => {
      const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
      if (!token) {
        toast({
          variant: "destructive",
          title: "Sesión requerida",
          description: "Debes iniciar sesión como administrador.",
        });
        return;
      }

      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = fullName.trim();
      if (!trimmedEmail || !trimmedName) {
        toast({
          variant: "destructive",
          title: "Formulario incompleto",
          description: "Indica el correo y el nombre completo del nuevo administrador.",
        });
        return;
      }

      setIsSending(true);
      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/auth/admin/invite`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: trimmedEmail, fullName: trimmedName }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          toast({
            variant: "destructive",
            title: "No se pudo enviar el código",
            description: parseErrorMessage(data, "Revisa los datos o la configuración del servidor."),
          });
          return;
        }

        toast({
          title: isResend ? "Código reenviado" : "Código enviado",
          description: `Revisa la bandeja de ${trimmedEmail} (Resend).`,
        });
        setPhase(2);
        setCode("");
        setPassword("");
      } catch {
        toast({
          variant: "destructive",
          title: "Sin conexión",
          description: "No se pudo conectar con el backend.",
        });
      } finally {
        setIsSending(false);
      }
    },
    [apiBaseUrl, email, fullName, parseErrorMessage],
  );

  const onSendCodeForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendVerificationCode(false);
  };

  const onAddAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();
    if (!/^\d{6}$/.test(trimmedCode)) {
      toast({
        variant: "destructive",
        title: "Código inválido",
        description: "El código debe tener exactamente 6 dígitos.",
      });
      return;
    }
    if (password.length < 8) {
      toast({
        variant: "destructive",
        title: "Contraseña corta",
        description: "La contraseña debe tener al menos 8 caracteres.",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/admin/invite/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          code: trimmedCode,
          password,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "No se pudo crear el administrador",
          description: parseErrorMessage(data, "Código incorrecto, expirado o correo ya registrado."),
        });
        return;
      }

      toast({
        title: "Administrador creado",
        description: `${trimmedEmail} ya puede iniciar sesión en el panel con su contraseña.`,
      });
      resetFlow();
    } catch {
      toast({
        variant: "destructive",
        title: "Sin conexión",
        description: "No se pudo conectar con el backend.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const emailDisplay = email.trim().toLowerCase();

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminModuleHero
        title="Agregar administrador"
        subtitle="Envía el código por correo (Resend) y termina el alta del nuevo administrador en esta misma pantalla."
        actionLabel="Empezar de nuevo"
        onAction={resetFlow}
        bordered={false}
      />

      <div
        className="mb-6 h-1 overflow-hidden rounded-full bg-black/40 ring-1 ring-gold/10"
        aria-hidden
      >
        <div
          className={cn(
            "h-full rounded-full bg-linear-to-r from-gold/40 via-gold/70 to-gold/40 transition-all duration-500 ease-out",
            phase === 2 ? "w-full" : "w-[38%]",
          )}
        />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:mb-8 lg:grid-cols-4 lg:gap-4">
        {(
          [
            ["PASO 1", "Nuevo administrador"],
            ["PASO 2", "Código por correo"],
            ["PASO 3", "Contraseña"],
            ["PASO 4", "Alta final"],
          ] as const
        ).map(([label, value], i) => (
          <div
            key={label}
            className={cn(
              "relative overflow-hidden rounded-xl border px-4 py-3 shadow-[inset_0_1px_0_rgba(197,165,90,0.06)] transition",
              phase === 2 && i >= 1
                ? "border-gold/35 bg-gold/8 ring-1 ring-gold/15"
                : "border-gold/15 bg-black/25",
            )}
          >
            <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-gold/10 blur-2xl" />
            <p className="relative font-brand text-[10px] tracking-[0.18em] text-gold/75">{label}</p>
            <p className="relative mt-1 truncate font-brand text-base tracking-wide text-gold md:text-lg">{value}</p>
          </div>
        ))}
      </div>

      <section
        id="add-admin-flow"
        className="overflow-hidden rounded-2xl border border-gold/14 bg-black/15 shadow-[0_14px_48px_rgba(0,0,0,0.35)]"
      >
        <div className="border-b border-gold/12 bg-linear-to-r from-gold/10 via-transparent to-transparent px-5 py-4 md:px-8 md:py-5">
          <div className="flex flex-wrap items-center gap-2">
            <UserPlus className="h-5 w-5 text-gold/80" strokeWidth={1.4} />
            <h2 className="font-brand text-sm tracking-[0.16em] text-gold">Alta de administrador</h2>
          </div>
        </div>

        <div className="grid gap-6 p-5 md:gap-8 md:p-8 lg:grid-cols-2 lg:items-stretch">
          {/* Columna: datos del nuevo administrador */}
          <div
            className={cn(
              "flex h-full min-h-0 flex-col rounded-2xl border bg-black/22 p-5 shadow-inner md:p-6",
              phase === 1 ? "border-gold/28 ring-1 ring-gold/12" : "border-gold/14",
            )}
          >
            <div className="mb-5 flex items-center gap-3 border-b border-gold/10 pb-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-gold/12 font-brand text-xs text-gold">
                1
              </span>
              <div>
                <p className="font-brand text-[10px] tracking-[0.2em] text-gold/65">NUEVO ADMIN</p>
                <p className="font-brand text-sm tracking-[0.12em] text-gold">Correo y nombre</p>
              </div>
            </div>

            <form onSubmit={onSendCodeForm} className="flex flex-1 flex-col space-y-5">
              <label className="block">
                <span className="flex items-center gap-2 font-brand text-[11px] tracking-[0.2em] text-gold/95">
                  <Mail className="h-3.5 w-3.5 text-gold/70" strokeWidth={1.5} />
                  CORREO ELECTRÓNICO
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={phase === 2}
                  autoComplete="off"
                  placeholder="nuevo.admin@ejemplo.com"
                  className="mt-2 h-12 w-full rounded-xl border border-gold/30 bg-black/40 px-4 text-sm text-foreground outline-none transition placeholder:text-foreground/35 focus:border-gold/55 focus:ring-2 focus:ring-gold/20 disabled:cursor-not-allowed disabled:opacity-55"
                  required
                />
                <p className="mt-1.5 font-body text-[11px] text-foreground/45">
                  Aquí llegará el código de verificación (Resend).
                </p>
              </label>

              <label className="block">
                <span className="flex items-center gap-2 font-brand text-[11px] tracking-[0.2em] text-gold/95">
                  <User className="h-3.5 w-3.5 text-gold/70" strokeWidth={1.5} />
                  NOMBRE COMPLETO
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={phase === 2}
                  placeholder="Como figurará en el panel"
                  className="mt-2 h-12 w-full rounded-xl border border-gold/30 bg-black/40 px-4 text-sm text-foreground outline-none transition placeholder:text-foreground/35 focus:border-gold/55 focus:ring-2 focus:ring-gold/20 disabled:cursor-not-allowed disabled:opacity-55"
                  required
                  minLength={2}
                />
              </label>

              <div className="mt-auto flex flex-wrap gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isSending || phase === 2}
                  className={cn(
                    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gold/45 bg-gold/18 px-6 font-brand text-sm tracking-[0.08em] text-gold transition hover:border-gold/60 hover:bg-gold/28",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                >
                  <Send className="h-4 w-4 shrink-0" strokeWidth={1.6} />
                  {isSending ? "Enviando…" : "Enviar verificación"}
                </button>
                {phase === 2 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPhase(1);
                      setCode("");
                      setPassword("");
                    }}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gold/22 bg-black/30 px-5 font-brand text-[10px] tracking-[0.12em] text-foreground/75 transition hover:border-gold/40 hover:text-gold"
                  >
                    <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Editar correo o nombre
                  </button>
                ) : null}
              </div>
            </form>
          </div>

          {/* Columna: código y contraseña */}
          <div
            className={cn(
              "relative flex h-full min-h-0 flex-col rounded-2xl border p-5 shadow-inner md:p-6",
              phase === 2
                ? "border-gold/30 bg-black/25 ring-1 ring-gold/15"
                : "border-gold/10 border-dashed bg-black/18",
            )}
          >
            <div className="mb-4 flex items-center gap-3 border-b border-gold/10 pb-4">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-brand text-xs",
                  phase === 2
                    ? "border-gold/40 bg-gold/15 text-gold"
                    : "border-gold/15 bg-black/40 text-foreground/40",
                )}
              >
                2
              </span>
              <div>
                <p className="font-brand text-[10px] tracking-[0.2em] text-gold/65">VERIFICACIÓN</p>
                <p className="font-brand text-sm tracking-[0.12em] text-gold">Código y contraseña</p>
              </div>
            </div>

            {phase === 1 ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-2 py-6 text-center md:py-10">
                <KeyRound className="h-10 w-10 text-gold/25" strokeWidth={1.2} />
                <p className="max-w-xs font-body text-sm leading-relaxed text-foreground/50">
                  Cuando pulses <span className="text-gold/85">Enviar verificación</span>, aquí podrás escribir el
                  código de 6 dígitos y la contraseña del nuevo administrador.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-5 flex gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 shadow-[inset_0_1px_0_rgba(52,211,153,0.08)]">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300/95" strokeWidth={1.75} />
                  <div className="min-w-0 text-left">
                    <p className="font-brand text-[10px] tracking-[0.14em] text-emerald-200/95">Código válido</p>
                    <p className="mt-1 font-body text-xs leading-relaxed text-foreground/75">
                      Solo aceptamos el <strong className="text-gold/90">código numérico de exactamente 6 dígitos</strong>{" "}
                      del <strong className="text-gold/90">último correo</strong> que envió el sistema a{" "}
                      <span className="font-mono text-[11px] text-gold/85">{emailDisplay}</span>. Si reenvías el
                      código, usa siempre el más reciente. El servidor comprueba que coincida con el generado al
                      enviar.
                    </p>
                  </div>
                </div>

                <form onSubmit={onAddAdmin} className="flex flex-1 flex-col space-y-5">
                  <label className="block">
                    <span className="flex items-center gap-2 font-brand text-[11px] tracking-[0.2em] text-gold/95">
                      <KeyRound className="h-3.5 w-3.5 text-gold/70" strokeWidth={1.5} />
                      CÓDIGO DE VERIFICACIÓN
                    </span>
                    <input
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="• • • • • •"
                      className="mt-2 h-14 w-full max-w-xs rounded-xl border border-gold/35 bg-black/45 px-4 text-center font-mono text-2xl tracking-[0.45em] text-gold placeholder:text-gold/20 placeholder:tracking-[0.2em] focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/25"
                      required
                    />
                    <p className="mt-1.5 font-body text-[11px] text-foreground/45">
                      {code.length}/6 dígitos — debe coincidir con el correo recibido.
                    </p>
                  </label>

                  <label className="block">
                    <span className="flex items-center gap-2 font-brand text-[11px] tracking-[0.2em] text-gold/95">
                      <Lock className="h-3.5 w-3.5 text-gold/70" strokeWidth={1.5} />
                      CONTRASEÑA DEL NUEVO ADMIN
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Mínimo 8 caracteres"
                      minLength={8}
                      className="mt-2 h-12 w-full rounded-xl border border-gold/30 bg-black/40 px-4 text-sm text-foreground outline-none transition placeholder:text-foreground/35 focus:border-gold/55 focus:ring-2 focus:ring-gold/20"
                      required
                    />
                  </label>

                  <div className="mt-auto flex flex-wrap gap-3 border-t border-gold/10 pt-5">
                    <button
                      type="submit"
                      disabled={isVerifying}
                      className={cn(
                        "inline-flex min-h-11 items-center justify-center rounded-xl border border-gold/45 bg-gold/18 px-8 font-brand text-sm tracking-[0.08em] text-gold transition hover:border-gold/60 hover:bg-gold/28",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                      )}
                    >
                      {isVerifying ? "Creando…" : "Agregar administrador"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void sendVerificationCode(true)}
                      disabled={isSending}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gold/22 bg-black/35 px-5 font-brand text-[10px] tracking-[0.12em] text-foreground/75 transition hover:border-gold/40 hover:text-gold disabled:opacity-50"
                    >
                      Reenviar código
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
