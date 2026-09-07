import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  Building, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { 
  authenticateUser, 
  requestRegistration, 
  SystemUser, 
  ADMIN_CREDENTIALS 
} from '../authService';

export interface AuthUser {
  name: string;
  email: string;
  workshop?: string;
  role: string;
  loginTime: string;
  isAdmin?: boolean;
}

interface HenizaAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  targetViewName?: string;
}

export default function HenizaAuthModal({
  isOpen,
  onClose,
  onSuccess,
  targetViewName = 'Diagnóstico Automotivo'
}: HenizaAuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [workshop, setWorkshop] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor, informe o e-mail e a senha.');
      return;
    }

    setIsLoading(true);
    const result = await authenticateUser(email, password);
    setIsLoading(false);

    if (!result.success || !result.user) {
      setErrorMessage(result.message);
      return;
    }

    const authUser: AuthUser = {
      name: result.user.name,
      email: result.user.email,
      workshop: result.user.workshop,
      role: result.user.role,
      loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAdmin: result.user.isAdmin
    };

    onSuccess(authUser);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Preencha os campos obrigatórios (Nome, E-mail e Senha).');
      return;
    }

    if (password.trim().length < 4) {
      setErrorMessage('A senha deve conter no mínimo 4 caracteres.');
      return;
    }

    setIsLoading(true);
    const result = await requestRegistration({ name, email, password, workshop });
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.message);
      return;
    }

    setSuccessNotice(result.message);
    setPassword('');
  };

  const fillAdminCredentials = () => {
    setEmail('');
    setPassword('');
    setTab('login');
    setErrorMessage('');
    setSuccessNotice('Credenciais do Administrador preenchidas. Clique em "Entrar no Sistema".');
  };

  const handleQuickDemoAccess = async () => {
    setIsLoading(true);
    const result = await authenticateUser('carlos.mecanico@oficia.com.br', '12345678');
    setIsLoading(false);
    if (result.success && result.user) {
      onSuccess({ ...result.user, loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isAdmin: false });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-tech-cartao border-2 border-tech-destaque/40 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative animate-scaleUp max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow de acabamento */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-tech-destaque via-cyan-400 to-tech-destaque" />

        {/* Header do Modal */}
        <div className="p-3.5 sm:p-5 pb-3 flex items-start justify-between border-b border-tech-borda">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tech-destaque/15 border border-tech-destaque/40 flex items-center justify-center text-tech-destaque shadow-[0_0_12px_rgba(0,255,102,0.3)] shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white font-display flex items-center gap-1.5">
                Acesso Restrito ao OficIA
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Autenticação necessária para acessar <strong className="text-tech-destaque">{targetViewName}</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas: Entrar / Cadastrar */}
        <div className="flex border-b border-tech-borda bg-tech-fundo/80 shrink-0">
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMessage(''); setSuccessNotice(null); }}
            className={`flex-1 py-2.5 text-xs font-mono font-bold tracking-wider uppercase transition cursor-pointer ${
              tab === 'login'
                ? 'text-tech-destaque border-b-2 border-tech-destaque bg-tech-destaque/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Entrar com E-mail
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setErrorMessage(''); setSuccessNotice(null); }}
            className={`flex-1 py-2.5 text-xs font-mono font-bold tracking-wider uppercase transition cursor-pointer ${
              tab === 'register'
                ? 'text-tech-destaque border-b-2 border-tech-destaque bg-tech-destaque/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Criar Cadastro
          </button>
        </div>

        {/* Corpo do formulário */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">

          {/* Mensagem de Erro se houver */}
          {errorMessage && (
            <div className="p-3 bg-red-950/70 border border-red-500/50 rounded-xl text-xs text-red-200 font-mono flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Mensagem de Sucesso (ex: Pedido enviado ao administrador) */}
          {successNotice && (
            <div className="p-3 bg-tech-sucesso/15 border border-tech-sucesso/50 rounded-xl text-xs text-tech-sucesso font-mono flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                {successNotice}
                {tab === 'register' && (
                  <div className="mt-2 pt-2 border-t border-tech-sucesso/30 flex items-center justify-between">
                    <span className="text-[11px] text-slate-300">Deseja tentar login?</span>
                    <button
                      type="button"
                      onClick={() => { setTab('login'); setSuccessNotice(null); }}
                      className="text-white bg-tech-sucesso/20 hover:bg-tech-sucesso/30 px-2 py-0.5 rounded text-[11px] font-bold underline cursor-pointer"
                    >
                      Ir para Login
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                  E-mail ou Usuário
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: natanaelmessiasdesouza@gmail.com"
                    className="w-full bg-tech-fundo border border-tech-borda rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-tech-destaque focus:outline-none placeholder:text-slate-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-tech-fundo border border-tech-borda rounded-lg pl-9 pr-10 py-2 text-xs text-white focus:border-tech-destaque focus:outline-none placeholder:text-slate-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono">
                <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-tech-fundo border-tech-borda text-tech-destaque focus:ring-0"
                  />
                  <span>Lembrar meu acesso</span>
                </label>
                <button
                  type="button"
                  onClick={fillAdminCredentials}
                  className="text-tech-destaque hover:underline cursor-pointer font-bold"
                  title="Preencher com credenciais do Administrador"
                >
                  Entrar como Admin
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-tech-destaque hover:bg-tech-destaque/90 text-tech-fundo font-black font-mono text-xs uppercase tracking-wider rounded-xl transition shadow-[0_0_20px_rgba(0,255,102,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-tech-fundo border-t-transparent rounded-full animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              {/* Aviso sobre aprovação necessária */}
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 font-mono flex items-start gap-2">
                <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  <strong>Aviso de Segurança:</strong> O cadastro passará pela autorização do Administrador Geral antes de liberar o acesso.
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome ou do técnico"
                    className="w-full bg-tech-fundo border border-tech-borda rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-tech-destaque focus:outline-none placeholder:text-slate-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                  Nome da Oficina / Centro Automotivo
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={workshop}
                    onChange={(e) => setWorkshop(e.target.value)}
                    placeholder="Ex: Mecânica Silva & Filhos"
                    className="w-full bg-tech-fundo border border-tech-borda rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-tech-destaque focus:outline-none placeholder:text-slate-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                  E-mail para Acesso
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@oficina.com.br"
                    className="w-full bg-tech-fundo border border-tech-borda rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-tech-destaque focus:outline-none placeholder:text-slate-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                  Criar Senha
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full bg-tech-fundo border border-tech-borda rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-tech-destaque focus:outline-none placeholder:text-slate-600 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-black font-mono text-xs uppercase tracking-wider rounded-xl transition shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Enviando pedido ao Administrador...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Solicitar Autorização de Acesso</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Divisor */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-tech-borda w-full" />
            <span className="bg-tech-cartao px-2 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
              Acesso Rápido Homologado
            </span>
          </div>

          {/* Botão de Demonstração / 1-Clique com técnico pré-aprovado */}
          <button
            type="button"
            onClick={handleQuickDemoAccess}
            disabled={isLoading}
            className="w-full py-2 bg-tech-fundo hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 hover:border-tech-destaque/60 font-mono text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-tech-destaque" />
            <span>Entrar como Técnico Especialista Homologado</span>
          </button>

        </div>

        {/* Rodapé de Segurança com Indicação do Administrador */}
        <div className="p-3 bg-tech-fundo/90 border-t border-tech-borda flex items-center justify-between gap-2 text-[10px] text-slate-400 font-mono shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-tech-destaque" />
            <span>Supervisão: Natanael Messias</span>
          </div>
          <span className="text-[9px] text-slate-500">OficIA • HENIZA TECH</span>
        </div>

      </div>
    </div>
  );
}
