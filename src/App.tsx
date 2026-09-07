import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Database, 
  CheckCircle2, 
  Languages, 
  Wifi, 
  WifiOff, 
  Sparkles,
  Layers,
  HelpCircle,
  ArrowLeft,
  Home,
  BookOpen,
  Handshake,
  Lock,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  Bell,
  Smartphone
} from 'lucide-react';

import OficIA from './components/OficIA';
import OricIA from './components/OricIA';
import PredicIA from './components/PredicIA';
import GlassIA from './components/GlassIA';
import HenizaBrand, { HenizaEmblem, HenizaWordmark } from './components/HenizaBrand';
import HenizaHome from './components/HenizaHome';
import HenizaInstrucoes from './components/HenizaInstrucoes';
import HenizaParceiro from './components/HenizaParceiro';
import HenizaAuthModal, { AuthUser } from './components/HenizaAuthModal';
import AdminAccessModal from './components/AdminAccessModal';
import AdminDashboard from './components/AdminDashboard';
import InstallMobileModal from './components/InstallMobileModal';
import { getPendingCount, ADMIN_CREDENTIALS } from './authService';

import {
  t,
  INITIAL_INVENTORY,
  INITIAL_HISTORIES,
  INITIAL_MOBILE_BUDGETS,
  INITIAL_AGENDA_EVENTS,
  MOBILE_PIECE_STOCKS,
  SelectedLang
} from './data';

export default function App() {
  const [lang, setLang] = useState<SelectedLang>('pt');
  
  // Navigation: 'home' (opening with clear instructions & 3 buttons) | 'diagnostico' | 'instrucoes' | 'parceiro'
  const [activeView, setActiveView] = useState<'home' | 'diagnostico' | 'instrucoes' | 'parceiro' | 'admin'>('home');

  // Authentication State
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('oficia_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(() => getPendingCount());
  const [pendingView, setPendingView] = useState<'diagnostico' | 'instrucoes' | null>(null);

  // Monitor pending registration requests for administrator
  useEffect(() => {
    const updateCount = () => {
      setPendingRequestsCount(getPendingCount());
    };
    updateCount();
    const interval = setInterval(updateCount, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (view: 'home' | 'diagnostico' | 'instrucoes' | 'parceiro' | 'admin') => {
    if (view === 'diagnostico' || view === 'instrucoes') {
      if (!authUser) {
        setPendingView(view);
        setIsAuthModalOpen(true);
        return;
      }
    }
    setActiveView(view);
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setAuthUser(user);
    try {
      localStorage.setItem('oficia_auth_user', JSON.stringify(user));
    } catch (err) {
      console.error(err);
    }
    setIsAuthModalOpen(false);
    setPendingRequestsCount(getPendingCount());
    const target = pendingView || 'diagnostico';
    setActiveView(target);
    setPendingView(null);
    setSuccessToast(`Bem-vindo, ${user.name}! Acesso liberado.`);
  };

  const handleLogout = () => {
    setAuthUser(null);
    try {
      localStorage.removeItem('oficia_auth_user');
    } catch (err) {
      console.error(err);
    }
    if (activeView === 'diagnostico' || activeView === 'instrucoes') {
      setActiveView('home');
    }
    setSuccessToast('Sessão encerrada com sucesso.');
  };

  // Network State
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Core App Stores
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [maintenanceHistory, setMaintenanceHistory] = useState(INITIAL_HISTORIES);
  const [mobileBudgets, setMobileBudgets] = useState(INITIAL_MOBILE_BUDGETS);
  const [agendaEvents, setAgendaEvents] = useState(INITIAL_AGENDA_EVENTS);
  const [pieceStocks, setPieceStocks] = useState(MOBILE_PIECE_STOCKS);

  // Persistence hooks
  useEffect(() => {
    const savedInv = localStorage.getItem('auto_inventory_sys');
    const savedHist = localStorage.getItem('auto_hist_sys');
    const savedQueue = localStorage.getItem('auto_sync_queue');
    const savedBudgets = localStorage.getItem('auto_mobile_budgets');
    const savedEvents = localStorage.getItem('auto_agenda_events');
    const savedStocks = localStorage.getItem('auto_piece_stocks');

    if (savedInv) setInventory(JSON.parse(savedInv));
    if (savedHist) setMaintenanceHistory(JSON.parse(savedHist));
    if (savedQueue) setOfflineQueue(JSON.parse(savedQueue));
    if (savedBudgets) setMobileBudgets(JSON.parse(savedBudgets));
    if (savedEvents) setAgendaEvents(JSON.parse(savedEvents));
    if (savedStocks) setPieceStocks(JSON.parse(savedStocks));
  }, []);

  const saveToStorage = (updatedInv: any, updatedHist: any, updatedBudgets?: any, updatedEvents?: any, updatedStocks?: any) => {
    localStorage.setItem('auto_inventory_sys', JSON.stringify(updatedInv));
    localStorage.setItem('auto_hist_sys', JSON.stringify(updatedHist));
    if (updatedBudgets) localStorage.setItem('auto_mobile_budgets', JSON.stringify(updatedBudgets));
    if (updatedEvents) localStorage.setItem('auto_agenda_events', JSON.stringify(updatedEvents));
    if (updatedStocks) localStorage.setItem('auto_piece_stocks', JSON.stringify(updatedStocks));
  };

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Network offline triggers
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setSuccessToast("Conexão online reestabelecida.");
    };
    const handleOffline = () => {
      setIsOffline(true);
      setSuccessToast("Modo offline ativado.");
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleSimulatedNetwork = () => {
    const nextState = !isOffline;
    setIsOffline(nextState);
    setSuccessToast(nextState ? "Modo Offline simulado ativado." : "Modo Online conectado.");
  };

  return (
    <div id="main-app-container" className="min-h-screen bg-tech-fundo text-tech-texto font-sans print:bg-white print:text-black">
      
      {/* GLOBAL TOAST NOTIFICATION */}
      {successToast && (
        <div id="success-toast" className="fixed bottom-6 right-6 z-50 max-w-md animate-slideUp bg-tech-cartao border border-tech-destaque/40 text-tech-texto rounded-xl shadow-2xl p-4 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-tech-destaque shrink-0 animate-pulse" />
            <p className="text-xs font-semibold">{successToast}</p>
          </div>
          <button onClick={() => setSuccessToast(null)} className="ml-4 text-xs text-tech-destaque hover:underline cursor-pointer font-bold">
            OK
          </button>
        </div>
      )}

      {/* =========================================================================
          CLEAN SLIM HEADER (WITHOUT CLUTTER OR REDUNDANT BARS) — TOTALMENTE RESPONSIVO
          ========================================================================= */}
      <header className="bg-tech-cartao text-tech-texto border-b border-tech-borda print:hidden sticky top-0 z-30 shadow-xl">
        {/* Cyber Green & Titanium Accent Line */}
        <div className="h-1 bg-gradient-to-r from-tech-destaque via-slate-300 to-tech-destaque w-full shadow-[0_0_12px_#00FF66]" />
        
        <div className="max-w-6xl mx-auto px-2.5 sm:px-4 md:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Official HENIZA TECH Brand & Product Indicator */}
          <div 
            onClick={() => setActiveView('home')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-95 transition shrink-0"
            title="Clique para ir à Tela Inicial"
          >
            <div className="relative shrink-0">
              <div className="block sm:hidden">
                <HenizaEmblem size={28} />
              </div>
              <div className="hidden sm:block">
                <HenizaEmblem size={36} />
              </div>
              <div className="absolute inset-0 bg-tech-destaque/25 blur-lg rounded-full -z-10" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="scale-90 sm:scale-100 origin-left">
                  <HenizaWordmark size="sm" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-tech-destaque uppercase bg-tech-destaque/15 px-1.5 py-0.5 rounded border border-tech-destaque/30 shadow-[0_0_8px_rgba(0,255,102,0.2)]">
                  TECH
                </span>
                <span className="text-[9px] text-tech-secundario font-semibold font-mono hidden lg:inline">
                  HOLDING HENIZA
                </span>
              </div>
              <p className="text-[8px] tracking-[0.12em] text-slate-400 uppercase font-mono font-medium hidden xl:inline mt-0.5">
                TECNOLOGIA QUE CONECTA. SOLUÇÕES QUE TRANSFORMAM.
              </p>
            </div>
          </div>

          {/* Quick Settings: Início return button, User Auth Chip, Online/Offline toggle & Language */}
          <div className="flex items-center gap-1 sm:gap-2 justify-end shrink-0">
            {activeView !== 'home' && (
              <button
                onClick={() => setActiveView('home')}
                className="text-xs font-mono font-bold text-slate-300 hover:text-tech-destaque bg-tech-fundo px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-tech-borda hover:border-tech-destaque/40 transition flex items-center gap-1 cursor-pointer shadow-sm shrink-0"
                title="Voltar ao Início"
              >
                <Home className="w-3.5 h-3.5 text-tech-destaque" />
                <span className="hidden sm:inline">Início</span>
              </button>
            )}

            {/* User Authentication Status, Admin Panel, or Login Trigger */}
            {authUser ? (
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {/* Admin Management Button (Visible when logged in as Admin) */}
                {(authUser.isAdmin || authUser.email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase()) && (
                  <button
                    onClick={() => setActiveView('admin')}
                    className="relative text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.2)] shrink-0"
                    title="Abrir Painel de Autorizações e Pedidos de Acesso"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="hidden md:inline">Painel Admin</span>
                    {pendingRequestsCount > 0 ? (
                      <span className="bg-amber-400 text-black px-1.5 py-0.2 rounded-full text-[9px] font-black animate-pulse shadow-[0_0_8px_#F59E0B]">
                        {pendingRequestsCount}<span className="hidden lg:inline"> pendente{pendingRequestsCount > 1 ? 's' : ''}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[9px] hidden sm:inline">0</span>
                    )}
                  </button>
                )}

                <div className="flex items-center gap-1 bg-tech-fundo px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-tech-borda shadow-sm shrink-0">
                  <span className={`w-2 h-2 rounded-full inline-block ${authUser.isAdmin || authUser.email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() ? 'bg-amber-400 shadow-[0_0_6px_#F59E0B]' : 'bg-tech-destaque shadow-[0_0_6px_#00FF66]'} animate-pulse shrink-0`} />
                  <span className="text-[10px] font-mono text-slate-200 font-bold max-w-[65px] sm:max-w-[110px] md:max-w-[130px] truncate" title={`${authUser.name} (${authUser.role})`}>
                    {authUser.isAdmin || authUser.email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() ? 'Natanael' : authUser.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-slate-400 hover:text-red-400 ml-0.5 p-0.5 rounded cursor-pointer transition shrink-0"
                    title="Sair / Encerrar sessão"
                  >
                    <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setPendingView('diagnostico');
                  setIsAuthModalOpen(true);
                }}
                className="text-[10px] font-mono font-bold text-tech-destaque bg-tech-destaque/15 hover:bg-tech-destaque hover:text-tech-fundo px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-tech-destaque/40 transition flex items-center gap-1 cursor-pointer shadow-[0_0_10px_rgba(0,255,102,0.15)] shrink-0"
              >
                <LogIn className="w-3 h-3" />
                <span>Entrar</span>
              </button>
            )}

            {/* Botão de Instalação Mobile (PWA) */}
            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="text-[10px] font-mono font-bold text-slate-300 hover:text-tech-destaque bg-tech-fundo hover:bg-tech-cartao px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-tech-borda hover:border-tech-destaque/40 transition flex items-center gap-1 cursor-pointer shadow-sm shrink-0"
              title="Instalar no Smartphone da Oficina (QR Code & Guia)"
            >
              <Smartphone className="w-3.5 h-3.5 text-tech-destaque shrink-0" />
              <span className="hidden sm:inline">Instalar</span>
              <span className="hidden xl:inline">no Celular</span>
            </button>

            {/* Status Online/Offline */}
            <button 
              onClick={toggleSimulatedNetwork} 
              className={`text-[10px] font-black px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border transition flex items-center gap-1 cursor-pointer shrink-0 ${
                isOffline 
                  ? 'bg-tech-alerta/15 text-tech-alerta border-tech-alerta/35' 
                  : 'bg-tech-sucesso/15 text-tech-sucesso border-tech-sucesso/35 shadow-[0_0_10px_rgba(0,255,102,0.15)]'
              }`}
              title={isOffline ? "Modo Offline (Dados Locais)" : "Modo Online (Conectado)"}
            >
              {isOffline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3 animate-pulse" />}
              <span className="hidden sm:inline">{isOffline ? 'Offline' : 'Online'}</span>
            </button>

            {/* Idiomas */}
            <div className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] text-tech-secundario font-bold bg-tech-fundo p-0.5 sm:p-1 rounded-lg border border-tech-borda shrink-0">
              <Languages className="w-3 h-3 text-tech-destaque mr-0.5 hidden md:inline" />
              {(['pt', 'en', 'es'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-1 sm:px-1.5 py-0.5 rounded cursor-pointer uppercase ${
                    lang === l ? 'bg-tech-destaque text-tech-fundo font-black shadow-[0_0_6px_#00FF66]' : 'hover:text-tech-texto'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Barra de Navegação Rápida entre Módulos quando fora da Home */}
        {activeView !== 'home' && (
          <div className="bg-tech-fundo/90 border-t border-tech-borda/70 px-3 sm:px-4 md:px-6 py-1.5">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full no-scrollbar shrink-0">
                <button
                  onClick={() => setActiveView('home')}
                  className="font-mono text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Home className="w-3 h-3 text-tech-destaque" /> Início
                </button>
                <span className="text-slate-600">/</span>
                <span className="font-bold text-tech-destaque font-mono text-[11px] uppercase truncate">
                  {activeView === 'diagnostico' && 'Diagnóstico Automotivo'}
                  {activeView === 'instrucoes' && 'Instruções de Uso'}
                  {activeView === 'parceiro' && 'Seja um Parceiro'}
                </span>
              </div>

              {/* Botões de navegação rápida entre as páginas */}
              <div className="flex items-center gap-1 sm:gap-1.5 self-stretch sm:self-auto overflow-x-auto pb-0.5 sm:pb-0 max-w-full no-scrollbar">
                <button
                  onClick={() => handleNavigate('diagnostico')}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold cursor-pointer transition whitespace-nowrap ${
                    activeView === 'diagnostico' 
                      ? 'bg-tech-destaque text-tech-fundo shadow-[0_0_8px_rgba(0,255,102,0.25)]' 
                      : 'text-slate-400 hover:text-white bg-tech-cartao border border-tech-borda'
                  }`}
                >
                  Diagnóstico
                </button>
                <button
                  onClick={() => handleNavigate('instrucoes')}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold cursor-pointer transition whitespace-nowrap ${
                    activeView === 'instrucoes' 
                      ? 'bg-cyan-400 text-tech-fundo shadow-[0_0_8px_rgba(6,182,212,0.25)]' 
                      : 'text-slate-400 hover:text-white bg-tech-cartao border border-tech-borda'
                  }`}
                >
                  Instruções
                </button>
                <button
                  onClick={() => handleNavigate('parceiro')}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold cursor-pointer transition whitespace-nowrap ${
                    activeView === 'parceiro' 
                      ? 'bg-amber-400 text-black shadow-[0_0_8px_rgba(245,158,11,0.25)]' 
                      : 'text-slate-400 hover:text-white bg-tech-cartao border border-tech-borda'
                  }`}
                >
                  Ser Parceiro
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          MAIN APPLICATION VIEW — RENDERIZA CONFORME activeView
          ========================================================================= */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 print:p-0">
        {activeView === 'home' && (
          <HenizaHome 
            onNavigate={handleNavigate} 
            isLoggedIn={!!authUser} 
            onOpenInstallModal={() => setIsInstallModalOpen(true)}
          />
        )}

        {activeView === 'admin' && (
          authUser && (authUser.isAdmin || authUser.email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase()) ? (
            <AdminDashboard
              currentUser={authUser}
              onBack={() => setActiveView('home')}
              onStatusChange={() => setPendingRequestsCount(getPendingCount())}
            />
          ) : (
            <div className="mx-auto my-12 max-w-lg rounded-2xl border border-amber-500/40 bg-tech-cartao p-8 text-center shadow-2xl">
              <ShieldCheck className="mx-auto mb-3 size-10 text-amber-300" />
              <h2 className="text-xl font-black text-white">Acesso administrativo restrito</h2>
              <p className="mt-2 text-sm text-slate-400">Entre com uma conta de administrador para acessar esta área.</p>
              <button onClick={() => setActiveView('home')} className="mt-5 rounded-xl bg-tech-destaque px-4 py-2 text-xs font-black text-tech-fundo">Voltar ao início</button>
            </div>
          )
        )}

        {activeView === 'diagnostico' && (
          !authUser ? (
            <div className="bg-tech-cartao border-2 border-tech-destaque/40 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-2xl space-y-4 animate-fadeIn my-12">
              <div className="w-14 h-14 rounded-2xl bg-tech-destaque/15 border border-tech-destaque/40 flex items-center justify-center text-tech-destaque mx-auto shadow-[0_0_20px_rgba(0,255,102,0.25)]">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-white font-display">Acesso Restrito ao Diagnóstico</h3>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Para utilizar o módulo de diagnóstico automotivo com Inteligência Artificial e protocolos OBD2/EV, é necessário realizar o login de operador ou técnico.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  onClick={() => {
                    setPendingView('diagnostico');
                    setIsAuthModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-tech-destaque hover:bg-tech-destaque/90 text-tech-fundo font-black font-mono text-xs uppercase tracking-wider rounded-xl transition shadow-[0_0_15px_rgba(0,255,102,0.3)] cursor-pointer"
                >
                  Fazer Login Agora
                </button>
                <button
                  onClick={() => setActiveView('home')}
                  className="px-4 py-2.5 bg-tech-fundo text-slate-300 hover:text-white font-mono text-xs rounded-xl border border-tech-borda cursor-pointer"
                >
                  Voltar à Tela Inicial
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-tech-borda">
                <button
                  onClick={() => setActiveView('home')}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-mono font-bold text-slate-300 hover:text-tech-destaque transition cursor-pointer bg-tech-cartao px-3 py-1.5 rounded-lg border border-tech-borda hover:border-tech-destaque/40"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar à Tela Inicial</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleNavigate('instrucoes')}
                    className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Dúvidas?</span> Ver Instruções
                  </button>
                </div>
              </div>

              <OficIA 
                lang={lang}
                isOffline={isOffline}
                setSuccessToast={setSuccessToast}
                inventory={inventory}
                setInventory={setInventory}
                maintenanceHistory={maintenanceHistory}
                setMaintenanceHistory={setMaintenanceHistory}
                mobileBudgets={mobileBudgets}
                setMobileBudgets={setMobileBudgets}
                agendaEvents={agendaEvents}
                setAgendaEvents={setAgendaEvents}
                saveToStorage={saveToStorage}
              />
            </div>
          )
        )}

        {activeView === 'instrucoes' && (
          !authUser ? (
            <div className="bg-tech-cartao border-2 border-cyan-500/40 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-2xl space-y-4 animate-fadeIn my-12">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-400 mx-auto shadow-[0_0_20px_rgba(6,182,212,0.25)]">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-white font-display">Acesso Restrito às Instruções</h3>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                O manual operacional e as orientações técnicas são exclusivos para operadores e oficinas credenciadas. Faça login para continuar.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  onClick={() => {
                    setPendingView('instrucoes');
                    setIsAuthModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-tech-fundo font-black font-mono text-xs uppercase tracking-wider rounded-xl transition shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
                >
                  Fazer Login Agora
                </button>
                <button
                  onClick={() => setActiveView('home')}
                  className="px-4 py-2.5 bg-tech-fundo text-slate-300 hover:text-white font-mono text-xs rounded-xl border border-tech-borda cursor-pointer"
                >
                  Voltar à Tela Inicial
                </button>
              </div>
            </div>
          ) : (
            <HenizaInstrucoes 
              onBack={() => setActiveView('home')} 
              onGoToDiagnostico={() => handleNavigate('diagnostico')} 
            />
          )
        )}

        {activeView === 'parceiro' && (
          <HenizaParceiro 
            onBack={() => setActiveView('home')} 
            setSuccessToast={setSuccessToast} 
          />
        )}
      </main>

      {/* MODAL DE AUTENTICAÇÃO DO OFICIA */}
      <HenizaAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingView(null);
        }}
        onSuccess={handleLoginSuccess}
        targetViewName={pendingView === 'instrucoes' ? 'Instruções de Uso' : 'Diagnóstico Automotivo'}
      />

      {/* MODAL DE GESTÃO E AUTORIZAÇÕES DO ADMINISTRADOR */}
      <AdminAccessModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onStatusChange={() => setPendingRequestsCount(getPendingCount())}
      />

      {/* MODAL DE INSTRUÇÕES DE INSTALAÇÃO NO SMARTPHONE (PWA / QR CODE) */}
      <InstallMobileModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* PRINT-ONLY TECHNICAL REPORT VIEW WITH HENIZA TIMBRE */}
      <section className="hidden print:block p-8 bg-white text-black font-sans max-w-4xl mx-auto">
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
          <div>
            <div className="text-xl font-black tracking-widest uppercase">
              HENIZA TECH <span className="text-xs font-normal font-mono">(Holding HENIZA)</span>
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-gray-600">
              TECNOLOGIA QUE CONECTA. SOLUÇÕES QUE TRANSFORMAM.
            </div>
            <h1 className="text-lg font-black uppercase tracking-tight mt-2 text-black">
              OficIA™ — Laudo Técnico Automotivo Oficial
            </h1>
            <p className="text-xs text-gray-700">Diagnóstico Assistido por IA & Manuais Mundiais de Serviço</p>
          </div>
          <div className="text-right text-xs">
            <span className="font-bold">Data de Emissão:</span> {new Date().toLocaleDateString('pt-BR')}
            <div className="text-[10px] text-gray-600 mt-1 font-mono">Autenticação: TRINDIA-{Date.now().toString().slice(-6)}</div>
          </div>
        </div>
        <p className="text-xs text-gray-600">Documento homologado para comprovação técnica, garantia de peças e frotas de locadoras.</p>
      </section>

      {/* OFFICIAL HENIZA FOOTER */}
      <footer className="bg-tech-cartao text-tech-secundario text-[11px] py-6 border-t border-tech-borda print:hidden mt-12">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <HenizaEmblem size={28} />
            <div>
              <div className="flex items-center gap-1.5">
                <HenizaWordmark size="sm" />
                <span className="text-[9px] font-bold text-tech-destaque bg-tech-destaque/10 px-1.5 py-0.5 rounded border border-tech-destaque/30">
                  TECH
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  • Holding HENIZA
                </span>
              </div>
              <p className="text-[9px] text-slate-400 font-mono tracking-wider uppercase mt-0.5">
                TECNOLOGIA QUE CONECTA. SOLUÇÕES QUE TRANSFORMAM.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-center md:text-right">
            <span className="font-mono text-xs">
              Ecossistema TrindIA™ • <span className="text-tech-texto font-bold">OficIA</span>
            </span>
            <a 
              href="mailto:natanaelmessiasdesouza@gmail.com" 
              className="text-tech-destaque font-mono font-bold hover:underline transition flex items-center gap-1"
            >
              natanaelmessiasdesouza@gmail.com
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
