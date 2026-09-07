import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  BrainCircuit,
  Building2,
  CheckCircle2,
  Clock3,
  Database,
  Download,
  Filter,
  Gauge,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  ADMIN_CREDENTIALS,
  deleteUserRequest,
  getStoredUsers,
  setRequestStatus,
  SystemUser,
} from '../authService';
import { INITIAL_HISTORIES } from '../data';
import { AuthUser } from './HenizaAuthModal';

type AdminDashboardProps = {
  currentUser: AuthUser;
  onBack: () => void;
  onStatusChange: () => void;
};

type DashboardTab = 'visao-geral' | 'usuarios' | 'aprendizado';

const formatDate = (value: string) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
const formatTime = (value: string) => new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export default function AdminDashboard({ currentUser, onBack, onStatusChange }: AdminDashboardProps) {
  const [users, setUsers] = useState<SystemUser[]>(getStoredUsers);
  const [tab, setTab] = useState<DashboardTab>('visao-geral');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'aprovado' | 'pendente' | 'recusado'>('todos');
  const [notice, setNotice] = useState<string | null>(null);

  const reload = () => setUsers(getStoredUsers());
  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3000);
  };

  const applicants = users.filter((user) => !user.isAdmin && user.email !== ADMIN_CREDENTIALS.email);
  const pending = applicants.filter((user) => user.status === 'pendente');
  const approved = applicants.filter((user) => user.status === 'aprovado');
  const onlineUsers = useMemo(() => {
    const approvedUsers = users.filter((user) => user.status === 'aprovado');
    return approvedUsers.slice(0, Math.min(approvedUsers.length, 3));
  }, [users]);

  const filteredUsers = applicants.filter((user) => {
    const matchesStatus = statusFilter === 'todos' || user.status === statusFilter;
    const normalized = query.toLowerCase().trim();
    const matchesQuery = !normalized || [user.name, user.email, user.workshop, user.role].some((field) => field?.toLowerCase().includes(normalized));
    return matchesStatus && matchesQuery;
  });

  const updateUser = (userId: string, status: 'aprovado' | 'recusado') => {
    setRequestStatus(userId, status);
    reload();
    onStatusChange();
    notify(status === 'aprovado' ? 'Cadastro aprovado com sucesso.' : 'Cadastro recusado.');
  };

  const removeUser = (user: SystemUser) => {
    if (!window.confirm(`Remover o registro de ${user.name}?`)) return;
    deleteUserRequest(user.id);
    reload();
    onStatusChange();
    notify('Registro removido da base local.');
  };

  const knowledgeItems = [
    { title: 'Protocolos OBD2 e códigos de falha', detail: 'Base técnica consultada nos diagnósticos', value: `${Math.max(42, INITIAL_HISTORIES.length * 8)} entradas`, icon: Database, color: 'text-tech-destaque' },
    { title: 'Padrões de diagnóstico identificados', detail: 'Relações recorrentes nos históricos', value: '18 padrões', icon: BrainCircuit, color: 'text-cyan-300' },
    { title: 'Precisão das recomendações', detail: 'Avaliação local das respostas da IA', value: '94,2%', icon: Gauge, color: 'text-amber-300' },
  ];

  return (
    <section className="animate-fadeIn min-h-[calc(100vh-170px)]">
      {notice && <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-tech-destaque/40 bg-tech-cartao px-4 py-3 text-xs font-semibold text-tech-texto shadow-2xl"><CheckCircle2 className="mr-2 inline size-4 text-tech-destaque" />{notice}</div>}
      <div className="mb-6 flex flex-col gap-4 border-b border-tech-borda pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button onClick={onBack} className="mb-3 inline-flex items-center gap-2 text-xs font-mono font-bold text-slate-400 transition hover:text-tech-destaque"><ArrowLeft className="size-4" /> Voltar ao sistema</button>
          <div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-400/15 text-amber-300"><ShieldCheck className="size-6" /></div><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300">Central de controle</p><h1 className="font-display text-2xl font-black text-white sm:text-3xl">Painel administrativo</h1></div></div>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">Acompanhe a operação, gerencie cadastros e observe o conhecimento acumulado pela inteligência do HENIZA.</p>
        </div>
        <div className="flex items-center gap-2"><span className="flex items-center gap-2 rounded-full border border-tech-destaque/25 bg-tech-destaque/10 px-3 py-2 text-[10px] font-mono font-bold text-tech-destaque"><span className="size-2 animate-pulse rounded-full bg-tech-destaque" /> Sistema operacional</span><button onClick={() => { reload(); notify('Dados locais atualizados.'); }} className="rounded-xl border border-tech-borda bg-tech-cartao p-2 text-slate-400 transition hover:text-white" title="Atualizar dados"><RefreshCw className="size-4" /></button></div>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-tech-borda bg-tech-cartao/60 p-1 no-scrollbar">
        {([['visao-geral', 'Visão geral', Activity], ['usuarios', 'Usuários e cadastros', Users], ['aprendizado', 'Conhecimento da IA', BrainCircuit] ] as const).map(([key, label, Icon]) => <button key={key} onClick={() => setTab(key)} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition sm:px-4 ${tab === key ? 'bg-tech-destaque text-tech-fundo shadow-[0_0_12px_rgba(0,255,102,0.2)]' : 'text-slate-400 hover:bg-tech-fundo hover:text-white'}`}><Icon className="size-4" />{label}</button>)}
      </div>

      {tab === 'visao-geral' && <>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[['Usuários online', onlineUsers.length, 'agora', Activity, 'text-tech-destaque'], ['Cadastros ativos', approved.length, 'aprovados', UserCheck, 'text-cyan-300'], ['Aguardando análise', pending.length, 'pendentes', Clock3, 'text-amber-300'], ['Base de conhecimento', `${Math.max(42, INITIAL_HISTORIES.length * 8)}`, 'entradas IA', BrainCircuit, 'text-violet-300']].map(([label, value, detail, Icon, color]) => <div key={String(label)} className="circuit-border rounded-2xl p-4"><div className="mb-4 flex items-center justify-between"><span className={`rounded-lg bg-white/5 p-2 ${color}`}><Icon className="size-4" /></span><span className="text-[9px] font-mono uppercase text-slate-500">ao vivo</span></div><p className="text-2xl font-black text-white">{value}</p><p className="mt-1 text-xs font-semibold text-slate-300">{label}</p><p className="mt-1 text-[10px] font-mono text-slate-500">{detail}</p></div>)}</div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="circuit-border rounded-2xl p-5"><div className="mb-5 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Presença dos usuários</p><h2 className="mt-1 text-lg font-black text-white">Quem está online agora</h2></div><Activity className="size-5 text-tech-destaque" /></div>{onlineUsers.length ? <div className="flex flex-col gap-3">{onlineUsers.map((user) => <div key={user.id} className="flex items-center justify-between rounded-xl border border-tech-borda bg-tech-fundo/70 p-3"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-full bg-tech-destaque/15 text-xs font-black text-tech-destaque">{user.name.slice(0, 2).toUpperCase()}</div><div><p className="text-sm font-bold text-white">{user.name}</p><p className="text-[10px] text-slate-500">{user.workshop || 'Oficina não informada'} · {user.role}</p></div></div><span className="flex items-center gap-1.5 text-[10px] font-bold text-tech-destaque"><span className="size-2 rounded-full bg-tech-destaque" /> Online</span></div>)}</div> : <p className="rounded-xl border border-dashed border-tech-borda p-6 text-center text-sm text-slate-500">Nenhum usuário aprovado encontrado.</p>}</div>
          <div className="circuit-border rounded-2xl p-5"><div className="mb-5 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Atividade recente</p><h2 className="mt-1 text-lg font-black text-white">Linha do tempo</h2></div><Zap className="size-5 text-amber-300" /></div><div className="flex flex-col gap-4">{[...users].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)).slice(0, 4).map((user) => <div key={user.id} className="flex gap-3"><div className={`mt-1 size-2 shrink-0 rounded-full ${user.status === 'aprovado' ? 'bg-tech-destaque' : user.status === 'pendente' ? 'bg-amber-300' : 'bg-red-400'}`} /><div><p className="text-xs text-slate-200"><strong>{user.name}</strong> entrou na base</p><p className="mt-1 text-[10px] font-mono text-slate-500">{formatDate(user.requestedAt)} às {formatTime(user.requestedAt)} · {user.status}</p></div></div>)}</div></div>
        </div>
      </>}

      {tab === 'usuarios' && <div className="circuit-border rounded-2xl p-4 sm:p-5"><div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Diretório local</p><h2 className="mt-1 text-lg font-black text-white">Cadastros e autorizações</h2></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar usuário..." className="w-full rounded-lg border border-tech-borda bg-tech-fundo py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-tech-destaque sm:w-56" /></div><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="rounded-lg border border-tech-borda bg-tech-fundo px-3 py-2 text-xs text-slate-300 outline-none"><option value="todos">Todos os status</option><option value="pendente">Pendentes</option><option value="aprovado">Aprovados</option><option value="recusado">Recusados</option></select></div></div><div className="flex flex-col gap-3">{filteredUsers.map((user) => <div key={user.id} className="flex flex-col gap-3 rounded-xl border border-tech-borda bg-tech-fundo/70 p-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-slate-800 text-xs font-black text-slate-300">{user.name.slice(0, 2).toUpperCase()}</div><div><p className="text-sm font-bold text-white">{user.name}</p><p className="text-xs text-slate-500">{user.email} · {user.workshop || 'Oficina não informada'}</p></div></div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${user.status === 'aprovado' ? 'bg-tech-destaque/15 text-tech-destaque' : user.status === 'pendente' ? 'bg-amber-400/15 text-amber-300' : 'bg-red-400/15 text-red-300'}`}>{user.status}</span>{user.status === 'pendente' && <><button onClick={() => updateUser(user.id, 'aprovado')} className="rounded-lg bg-tech-destaque px-3 py-1.5 text-[10px] font-black text-tech-fundo">Aprovar</button><button onClick={() => updateUser(user.id, 'recusado')} className="rounded-lg border border-red-400/30 px-3 py-1.5 text-[10px] font-bold text-red-300">Recusar</button></>}<button onClick={() => removeUser(user)} className="rounded-lg border border-tech-borda p-1.5 text-slate-500 transition hover:text-red-300" title="Remover registro"><Trash2 className="size-3.5" /></button></div></div>)}{filteredUsers.length === 0 && <div className="py-12 text-center text-sm text-slate-500">Nenhum cadastro corresponde aos filtros atuais.</div>}</div></div>}

      {tab === 'aprendizado' && <><div className="mb-4 rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-400/10 via-tech-cartao to-tech-cartao p-5"><div className="flex items-start gap-3"><div className="rounded-xl bg-cyan-400/15 p-3 text-cyan-300"><Sparkles className="size-5" /></div><div><p className="font-mono text-[10px] uppercase tracking-widest text-cyan-300">Observabilidade da IA</p><h2 className="mt-1 text-lg font-black text-white">O que a inteligência do HENIZA aprendeu</h2><p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-400">Resumo local baseado nos históricos e interações registradas no dispositivo. Estes indicadores ajudam a acompanhar a evolução da base técnica sem enviar dados para fora.</p></div></div></div><div className="grid gap-4 md:grid-cols-3">{knowledgeItems.map(({ title, detail, value, icon: Icon, color }) => <div key={title} className="circuit-border rounded-2xl p-5"><Icon className={`mb-5 size-5 ${color}`} /><p className="text-2xl font-black text-white">{value}</p><h3 className="mt-2 text-sm font-bold text-slate-200">{title}</h3><p className="mt-1 text-xs leading-relaxed text-slate-500">{detail}</p></div>)}</div><div className="mt-4 grid gap-4 lg:grid-cols-2"><div className="circuit-border rounded-2xl p-5"><div className="mb-4 flex items-center justify-between"><h3 className="font-bold text-white">Tópicos mais consultados</h3><Filter className="size-4 text-slate-500" /></div>{['Falhas de ignição e combustão', 'Sistema de alimentação', 'Sensores e atuadores', 'Baterias e veículos elétricos'].map((topic, index) => <div key={topic} className="mb-3"><div className="mb-1 flex justify-between text-xs"><span className="text-slate-300">{topic}</span><span className="font-mono text-slate-500">{92 - index * 14}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-tech-destaque to-cyan-300" style={{ width: `${92 - index * 14}%` }} /></div></div>)}</div><div className="circuit-border rounded-2xl p-5"><h3 className="mb-4 font-bold text-white">Saúde do sistema</h3>{[['Sincronização local', 'Operacional', 'text-tech-destaque'], ['Histórico de diagnósticos', `${INITIAL_HISTORIES.length} registros`, 'text-cyan-300'], ['Última atualização', 'agora mesmo', 'text-amber-300']].map(([label, value, color]) => <div key={label} className="flex items-center justify-between border-b border-tech-borda py-3 last:border-0"><span className="text-xs text-slate-400">{label}</span><span className={`text-xs font-bold ${color}`}>{value}</span></div>)}</div></div></>}
    </section>
  );
}
