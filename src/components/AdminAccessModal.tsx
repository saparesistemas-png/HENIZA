import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Clock, 
  Building, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Trash2,
  RefreshCw,
  Search
} from 'lucide-react';
import { 
  SystemUser, 
  getStoredUsers, 
  setRequestStatus, 
  deleteUserRequest, 
  ADMIN_CREDENTIALS 
} from '../authService';

interface AdminAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: () => void;
}

export default function AdminAccessModal({
  isOpen,
  onClose,
  onStatusChange
}: AdminAccessModalProps) {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [filter, setFilter] = useState<'pendente' | 'aprovado' | 'todos'>('pendente');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const loadUsers = () => {
    const list = getStoredUsers();
    setUsers(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApprove = (userId: string, name: string) => {
    const res = setRequestStatus(userId, 'aprovado');
    if (res.success) {
      setNotification(`Acesso de "${name}" AUTORIZADO com sucesso!`);
      loadUsers();
      if (onStatusChange) onStatusChange();
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleReject = (userId: string, name: string) => {
    const res = setRequestStatus(userId, 'recusado');
    if (res.success) {
      setNotification(`Pedido de "${name}" RECUSADO.`);
      loadUsers();
      if (onStatusChange) onStatusChange();
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleDelete = (userId: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja remover o registro de "${name}"?`)) {
      deleteUserRequest(userId);
      setNotification(`Registro de "${name}" removido.`);
      loadUsers();
      if (onStatusChange) onStatusChange();
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Filter users (excluding the main admin itself from the request list to keep focus on applicants)
  const filteredUsers = users
    .filter(u => !u.isAdmin && u.email.toLowerCase() !== ADMIN_CREDENTIALS.email.toLowerCase())
    .filter(u => {
      if (filter === 'pendente') return u.status === 'pendente';
      if (filter === 'aprovado') return u.status === 'aprovado';
      return true;
    })
    .filter(u => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.workshop && u.workshop.toLowerCase().includes(q))
      );
    });

  const pendingCount = users.filter(u => !u.isAdmin && u.status === 'pendente').length;
  const approvedCount = users.filter(u => !u.isAdmin && u.status === 'aprovado').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-tech-cartao border-2 border-amber-500/50 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden relative animate-scaleUp max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Superior */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-tech-destaque to-amber-500" />

        {/* Header do Painel */}
        <div className="p-5 border-b border-tech-borda flex items-start justify-between bg-tech-fundo/90">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white font-display">
                  Painel do Administrador • Pedidos de Acesso
                </h3>
                <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Gestão OficIA
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                Administrador: <strong className="text-tech-destaque">{ADMIN_CREDENTIALS.email}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificação Temporária de Ação */}
        {notification && (
          <div className="mx-5 mt-4 p-3 bg-tech-sucesso/15 border border-tech-sucesso/40 rounded-xl text-xs text-tech-sucesso font-mono flex items-center gap-2 animate-slideDown">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Barra de Controles e Filtros */}
        <div className="p-4 bg-tech-cartao border-b border-tech-borda flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFilter('pendente')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filter === 'pendente'
                  ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-tech-fundo text-slate-400 hover:text-white border border-tech-borda'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pendentes</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-black">
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setFilter('aprovado')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filter === 'aprovado'
                  ? 'bg-tech-destaque text-tech-fundo shadow-[0_0_12px_rgba(0,255,102,0.3)]'
                  : 'bg-tech-fundo text-slate-400 hover:text-white border border-tech-borda'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Autorizados</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-black">
                {approvedCount}
              </span>
            </button>

            <button
              onClick={() => setFilter('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                filter === 'todos'
                  ? 'bg-slate-700 text-white'
                  : 'bg-tech-fundo text-slate-400 hover:text-white border border-tech-borda'
              }`}
            >
              Todos
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome ou oficina..."
              className="w-full bg-tech-fundo border border-tech-borda rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>
        </div>

        {/* Lista de Pedidos de Acesso */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-tech-borda rounded-xl bg-tech-fundo/40">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">
                Nenhum pedido encontrado nesta categoria.
              </p>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Quando novos técnicos ou mecânicos se cadastrarem, o pedido aparecerá aqui para sua autorização.
              </p>
            </div>
          ) : (
            filteredUsers.map((applicant) => (
              <div
                key={applicant.id}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  applicant.status === 'pendente'
                    ? 'bg-gradient-to-r from-amber-950/20 via-tech-cartao to-tech-cartao border-amber-500/40 hover:border-amber-400 shadow-md'
                    : applicant.status === 'aprovado'
                    ? 'bg-tech-cartao/90 border-tech-destaque/30'
                    : 'bg-tech-fundo/50 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Detalhes do Usuário */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white font-display">
                        {applicant.name}
                      </h4>
                      
                      {applicant.status === 'pendente' && (
                        <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          Aguardando Autorização
                        </span>
                      )}

                      {applicant.status === 'aprovado' && (
                        <span className="text-[10px] font-mono font-bold bg-tech-destaque/15 text-tech-destaque border border-tech-destaque/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Acesso Autorizado
                        </span>
                      )}

                      {applicant.status === 'recusado' && (
                        <span className="text-[10px] font-mono font-bold bg-red-950/50 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                          Recusado
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-300 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{applicant.email}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{applicant.workshop || 'Oficina Não Informada'}</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 font-mono pt-1">
                      Data da Solicitação: {new Date(applicant.requestedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  {/* Ações do Administrador */}
                  <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-tech-borda">
                    {applicant.status === 'pendente' && (
                      <>
                        <button
                          onClick={() => handleApprove(applicant.id, applicant.name)}
                          className="px-3 py-1.5 bg-tech-destaque hover:bg-tech-destaque/90 text-tech-fundo font-black font-mono text-xs uppercase tracking-wider rounded-lg transition shadow-[0_0_12px_rgba(0,255,102,0.3)] flex items-center gap-1 cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Autorizar Acesso</span>
                        </button>

                        <button
                          onClick={() => handleReject(applicant.id, applicant.name)}
                          className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/40 font-mono text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Recusar</span>
                        </button>
                      </>
                    )}

                    {applicant.status === 'aprovado' && (
                      <button
                        onClick={() => handleReject(applicant.id, applicant.name)}
                        className="px-3 py-1.5 bg-tech-fundo hover:bg-red-950 text-slate-400 hover:text-red-300 border border-tech-borda hover:border-red-500/40 font-mono text-xs rounded-lg transition cursor-pointer"
                      >
                        Suspender Acesso
                      </button>
                    )}

                    {applicant.status === 'recusado' && (
                      <button
                        onClick={() => handleApprove(applicant.id, applicant.name)}
                        className="px-3 py-1.5 bg-tech-fundo hover:bg-tech-destaque/20 text-slate-300 hover:text-tech-destaque border border-tech-borda hover:border-tech-destaque/40 font-mono text-xs rounded-lg transition cursor-pointer"
                      >
                        Reativar & Autorizar
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(applicant.id, applicant.name)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                      title="Excluir do sistema"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé do Painel */}
        <div className="p-3 bg-tech-fundo/90 border-t border-tech-borda flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-tech-destaque animate-pulse" />
            <span>Os técnicos autorizados recebem liberação imediata para login com sua senha.</span>
          </div>

          <button
            onClick={loadUsers}
            className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer text-[11px]"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Atualizar lista</span>
          </button>
        </div>

      </div>
    </div>
  );
}
