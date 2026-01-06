import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/Logo";
import { IntelliXLogo } from "@/components/ui/IntelliXLogo";
import { ArrowLeft, Eye, EyeOff, Loader2, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(100),
});

const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  company: z.string().trim().min(2, "Nome da empresa deve ter pelo menos 2 caracteres").max(100),
});

const Auth = () => {
  const { signIn, signUp, resetPassword, updatePassword, user, loading: authLoading, isAdmin, isConsultor } = useAuth();
  const { toast } = useToast();

  const getQueryParam = (key: string) => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get(key);
  };

  const initialMode = getQueryParam("mode") === "register" ? "register" : 
                       getQueryParam("mode") === "forgot-password" ? "forgot-password" :
                       getQueryParam("mode") === "reset-password" ? "reset-password" : "login";
  const [mode, setMode] = useState<"login" | "register" | "forgot-password" | "reset-password">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    company: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      const next = getQueryParam("next");
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      const target = safeNext && safeNext !== "/auth" ? safeNext : isAdmin ? "/admin" : isConsultor ? "/consultor" : "/meu-projeto";
      window.location.replace(target);
    }
  }, [user, authLoading, isAdmin, isConsultor]);

  const validateForm = () => {
    try {
      if (mode === "register") {
        registerSchema.parse(formData);
      } else {
        loginSchema.parse({ email: formData.email, password: formData.password });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          let errorMessage = "Erro ao fazer login. Tente novamente.";

          if (error.message.includes("Invalid login")) {
            errorMessage = "Email ou senha incorretos";
          } else if (error.message.includes("Email not confirmed")) {
            errorMessage = "Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.";
          } else if (error.message.includes("Invalid email")) {
            errorMessage = "Email inválido";
          } else {
            // Show actual error for debugging
            errorMessage = error.message;
          }

          toast({
            title: "Erro no login",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } else {
        const { error } = await signUp(formData.email, formData.password, { nome: formData.name });
        if (error) {
          let errorMessage = "Erro ao criar conta. Tente novamente.";

          if (error.message.includes("already registered")) {
            errorMessage = "Este email já está cadastrado";
          } else if (error.message.includes("Password")) {
            errorMessage = "Senha muito fraca. Use pelo menos 6 caracteres";
          } else if (error.message.includes("valid email")) {
            errorMessage = "Por favor, insira um email válido";
          } else {
            // Show actual error for debugging
            errorMessage = error.message;
          }

          toast({
            title: "Erro no cadastro",
            description: errorMessage,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Conta criada!",
            description: "Verifique seu email para confirmar a conta e depois faça login.",
          });
          // Switch to login mode after successful registration
          setMode("login");
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Algo deu errado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !z.string().email().safeParse(formData.email).success) {
      setErrors({ email: "Por favor, insira um email válido" });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await resetPassword(formData.email);
      
      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada para redefinir sua senha.",
        });
        setMode("login");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Algo deu errado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword.length < 6) {
      setErrors({ newPassword: "Senha deve ter pelo menos 6 caracteres" });
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ confirmPassword: "As senhas não coincidem" });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await updatePassword(formData.newPassword);
      
      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Senha atualizada!",
          description: "Sua senha foi alterada com sucesso. Faça login com a nova senha.",
        });
        setMode("login");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Algo deu errado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md mx-auto">
          {/* Back Link */}
          <a
            href="https://grupo-cavendish.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao site
          </a>

          {/* Logo */}
          <div className="mb-8">
            <Logo size="lg" />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {mode === "login" ? "Bem-vindo de volta" : 
               mode === "register" ? "Crie sua conta" : 
               mode === "forgot-password" ? "Recuperar senha" :
               "Definir nova senha"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "login"
                ? "Entre para acessar seu portal de governança"
                : mode === "register" 
                ? "Comece sua jornada de governança inteligente"
                : mode === "forgot-password"
                ? "Digite seu email para receber o link de recuperação"
                : "Digite sua nova senha abaixo"}
            </p>
          </div>

          {/* Forgot Password Form */}
          {mode === "forgot-password" && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`h-11 ${errors.email ? "border-destructive" : ""}`}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar link de recuperação"
                )}
              </Button>
              
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrors({});
                }}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Voltar ao login
              </button>
            </form>
          )}

          {/* Reset Password Form */}
          {mode === "reset-password" && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className={`h-11 pr-10 ${errors.newPassword ? "border-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`h-11 ${errors.confirmPassword ? "border-destructive" : ""}`}
                />
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  "Atualizar senha"
                )}
              </Button>
            </form>
          )}

          {/* Login/Register Form */}
          {(mode === "login" || mode === "register") && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "register" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="João Silva"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`h-11 ${errors.name ? "border-destructive" : ""}`}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Nome da empresa</Label>
                  <Input
                    id="company"
                    name="company"
                    type="text"
                    placeholder="Empresa Ltda"
                    value={formData.company}
                    onChange={handleInputChange}
                    className={`h-11 ${errors.company ? "border-destructive" : ""}`}
                  />
                  {errors.company && <p className="text-xs text-destructive">{errors.company}</p>}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleInputChange}
                className={`h-11 ${errors.email ? "border-destructive" : ""}`}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot-password");
                      setErrors({});
                    }}
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                )}
                  </a>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`h-11 pr-10 ${errors.password ? "border-destructive" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : mode === "login" ? (
                "Entrar"
              ) : (
                "Criar conta"
              )}
            </Button>
          </form>
          )}

          {/* Toggle Mode */}
          {(mode === "login" || mode === "register") && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === "login" ? (
              <>
                Não tem uma conta?{" "}
                <button
                  onClick={() => {
                    setMode("register");
                    setErrors({});
                  }}
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Criar conta
                </button>
              </>
            ) : (
              <>
                Já tem uma conta?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setErrors({});
                  }}
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Fazer login
                </button>
              </>
            )}
          </p>
          )}

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Canal de Denúncias
              </span>
            </div>
          </div>

          {/* Whistleblower Link */}
          <a href="/denuncia">
            <Button variant="outline" className="w-full" size="lg">
              Fazer denúncia anônima
            </Button>
          </a>

          {/* IntelliX.AI Credit */}
          <p className="text-center text-xs text-muted-foreground mt-8">
            Desenvolvido por <span style={{ color: '#E5A61C' }}>IntelliX</span><span style={{ color: '#4A9BD9' }}>.AI</span>
          </p>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex flex-1 bg-sidebar items-center justify-center p-12 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-sidebar-primary rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent rounded-full blur-3xl" />
        </div>

        <div className="relative text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-sidebar-primary/20 flex items-center justify-center mx-auto mb-8">
            <TrendingUp className="w-10 h-10 text-sidebar-primary" />
          </div>
          <h2 className="text-3xl font-bold text-sidebar-foreground mb-4">
            Governança simplificada
          </h2>
          <p className="text-sidebar-foreground/70 text-lg">
            Automatize diagnósticos, gere documentos com IA e acompanhe a evolução
            da sua empresa em tempo real.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {["Atas automáticas", "Canal de denúncias", "Relatórios IA"].map(
              (feature) => (
                <span
                  key={feature}
                  className="px-4 py-2 rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-sm font-medium"
                >
                  {feature}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
