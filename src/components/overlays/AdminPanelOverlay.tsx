import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Volume2,
  Database,
  Plus,
  Trash2,
  Edit2,
  Shield,
  Check,
  Play,
  Key,
  RefreshCw,
  Copy,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
} from 'lucide-react';
import { Palette } from '../../constants/theme';
import { UserSession } from './AuthModal';
import { speechEngine } from '../../utils/speech';

interface UserRecord {
  id: number;
  nome: string;
  email: string;
  papel: 'admin' | 'operador';
  status: 'ativo' | 'inativo';
  criado_em?: string;
}

interface VoiceRecord {
  id: number;
  nome: string;
  voice_id: string;
  provedor: string;
  modelo: string;
  idioma: string;
  padrao: number;
  descricao?: string;
}

interface AdminPanelOverlayProps {
  palette: Palette;
  currentUser: UserSession | null;
  activeVoiceId: string;
  onVoiceChanged: (newVoiceId: string) => void;
  onClose: () => void;
}

export const AdminPanelOverlay: React.FC<AdminPanelOverlayProps> = ({
  palette,
  currentUser,
  activeVoiceId,
  onVoiceChanged,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'voices' | 'database'>('users');
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [voices, setVoices] = useState<VoiceRecord[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedConexao, setCopiedConexao] = useState(false);

  // User form modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSenha, setFormSenha] = useState('');
  const [formPapel, setFormPapel] = useState<'admin' | 'operador'>('operador');
  const [formStatus, setFormStatus] = useState<'ativo' | 'inativo'>('ativo');

  // Voice form modal state
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [vNome, setVNome] = useState('');
  const [vId, setVId] = useState('');
  const [vModelo, setVModelo] = useState('s2.1-pro-free');
  const [vDesc, setVDesc] = useState('');
  const [testingVoiceId, setTestingVoiceId] = useState<string | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, vRes, dRes] = await Promise.all([
        fetch('/api/admin/users').then((r) => r.json()),
        fetch('/api/admin/voices').then((r) => r.json()),
        fetch('/api/admin/db-status').then((r) => r.json()),
      ]);

      if (uRes.users) setUsers(uRes.users);
      if (vRes.voices) setVoices(vRes.voices);
      if (dRes) setDbStatus(dRes);
    } catch (e) {
      console.warn('Erro ao carregar dados do admin:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // User CRUD Operations
  const handleOpenCreateUser = () => {
    setEditingUserId(null);
    setFormNome('');
    setFormEmail('');
    setFormSenha('');
    setFormPapel('operador');
    setFormStatus('ativo');
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u: UserRecord) => {
    setEditingUserId(u.id);
    setFormNome(u.nome);
    setFormEmail(u.email);
    setFormSenha('');
    setFormPapel(u.papel);
    setFormStatus(u.status);
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        // Update
        await fetch(`/api/admin/users/${editingUserId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: formNome,
            email: formEmail,
            papel: formPapel,
            status: formStatus,
            senha: formSenha || undefined,
          }),
        });
      } else {
        // Create
        await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: formNome,
            email: formEmail,
            senha: formSenha || '123456',
            papel: formPapel,
            status: formStatus,
          }),
        });
      }
      setShowUserModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserStatus = async (u: UserRecord) => {
    const newStatus = u.status === 'ativo' ? 'inativo' : 'ativo';
    await fetch(`/api/admin/users/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...u,
        status: newStatus,
      }),
    });
    fetchData();
  };

  const handleDeleteUser = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir permanentemente este usuário?')) {
      await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  // Voice CRUD Operations
  const handleSaveVoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vNome.trim() || !vId.trim()) return;

    await fetch('/api/admin/voices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: vNome.trim(),
        voice_id: vId.trim(),
        modelo: vModelo.trim(),
        descricao: vDesc.trim(),
        padrao: false,
      }),
    });

    setShowVoiceModal(false);
    setVNome('');
    setVId('');
    fetchData();
  };

  const handleSetDefaultVoice = async (voice: VoiceRecord) => {
    await fetch(`/api/admin/voices/${voice.id}/default`, { method: 'PUT' });
    onVoiceChanged(voice.voice_id);
    fetchData();
  };

  const handleDeleteVoice = async (id: number) => {
    if (confirm('Deseja remover esta voz do painel?')) {
      await fetch(`/api/admin/voices/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const handleTestVoiceAudio = (voice: VoiceRecord) => {
    setTestingVoiceId(voice.voice_id);
    speechEngine.speak(
      `Olá! Esta é uma demonstração da voz neural ${voice.nome} configurada no Fish Audio para o sistema JARVIS.`,
      voice.voice_id,
      () => setTestingVoiceId(null),
      () => {}
    );
  };

  const sqlCode = `-- Executar no MySQL (phpMyAdmin ou terminal)
CREATE DATABASE IF NOT EXISTS \`emribeir_jarvismulti\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`emribeir_jarvismulti\`;

CREATE TABLE IF NOT EXISTS \`usuarios\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`nome\` VARCHAR(120) NOT NULL,
  \`email\` VARCHAR(150) NOT NULL UNIQUE,
  \`senha_hash\` VARCHAR(255) NOT NULL,
  \`papel\` ENUM('admin', 'operador') NOT NULL DEFAULT 'operador',
  \`status\` ENUM('ativo', 'inativo') NOT NULL DEFAULT 'ativo',
  \`criado_em\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS \`vozes_sistema\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`nome\` VARCHAR(100) NOT NULL,
  \`voice_id\` VARCHAR(150) NOT NULL,
  \`provedor\` VARCHAR(50) NOT NULL DEFAULT 'fishaudio',
  \`modelo\` VARCHAR(50) NOT NULL DEFAULT 's2.1-pro-free',
  \`idioma\` VARCHAR(20) NOT NULL DEFAULT 'pt-BR',
  \`padrao\` TINYINT(1) NOT NULL DEFAULT 0,
  \`descricao\` TEXT NULL
);

INSERT INTO \`usuarios\` (\`nome\`, \`email\`, \`senha_hash\`, \`papel\`, \`status\`)
VALUES ('Romildo Coelho', 'romildocoelhooficial@gmail.com', SHA2('Romildo2009@', 256), 'admin', 'ativo')
ON DUPLICATE KEY UPDATE \`status\` = 'ativo';

INSERT INTO \`vozes_sistema\` (\`nome\`, \`voice_id\`, \`provedor\`, \`modelo\`, \`idioma\`, \`padrao\`, \`descricao\`)
VALUES ('JARVIS Oficial PT-BR', '82d13948027e4be69892dd3d0104e681', 'fishaudio', 's2.1-pro-free', 'pt-BR', 1, 'Voz neural Fish Audio principal');`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        style={{
          backgroundColor: `${palette.PANEL2}f8`,
          borderColor: palette.BORDER_B,
          boxShadow: `0 16px 50px rgba(0,0,0,0.8), 0 0 30px ${palette.PRI}33`,
        }}
      >
        {/* Top Header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: palette.BORDER }}>
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-amber-400" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-widest uppercase font-mono" style={{ color: palette.WHITE }}>
                  PAINEL ADMINISTRATIVO // GESTÃO GLOBAL
                </h3>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  NÍVEL ADMIN
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">
                Operador autenticado: {currentUser?.nome || 'Romildo Coelho'} ({currentUser?.email || 'Admin'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-white transition-all text-xs font-mono flex items-center gap-1"
              title="Recarregar dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b text-xs font-mono select-none bg-black/30" style={{ borderColor: palette.BORDER }}>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-3 font-bold tracking-wider flex items-center gap-2 transition-all border-b-2 ${
              activeTab === 'users' ? 'text-white bg-black/40' : 'text-muted-foreground hover:text-white'
            }`}
            style={{
              borderColor: activeTab === 'users' ? palette.PRI : 'transparent',
              color: activeTab === 'users' ? palette.PRI : undefined,
            }}
          >
            <Users className="w-4 h-4" />
            <span>USUÁRIOS ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('voices')}
            className={`px-5 py-3 font-bold tracking-wider flex items-center gap-2 transition-all border-b-2 ${
              activeTab === 'voices' ? 'text-white bg-black/40' : 'text-muted-foreground hover:text-white'
            }`}
            style={{
              borderColor: activeTab === 'voices' ? palette.PRI : 'transparent',
              color: activeTab === 'voices' ? palette.PRI : undefined,
            }}
          >
            <Volume2 className="w-4 h-4" />
            <span>DEFINIÇÃO DE VOZES ({voices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`px-5 py-3 font-bold tracking-wider flex items-center gap-2 transition-all border-b-2 ${
              activeTab === 'database' ? 'text-white bg-black/40' : 'text-muted-foreground hover:text-white'
            }`}
            style={{
              borderColor: activeTab === 'database' ? palette.PRI : 'transparent',
              color: activeTab === 'database' ? palette.PRI : undefined,
            }}
          >
            <Database className="w-4 h-4" />
            <span>BANCO MYSQL & SCRIPTS SQL</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs font-mono space-y-4">
          {/* TAB 1: USERS CRUD */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs uppercase" style={{ color: palette.WHITE }}>
                    Controle de Usuários e Operadores
                  </h4>
                  <p className="text-[10px] text-muted-foreground">Crie, edite permissões, redefina senhas ou remova operadores</p>
                </div>
                <button
                  onClick={handleOpenCreateUser}
                  className="px-3.5 py-2 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow"
                  style={{ backgroundColor: palette.PRI, color: '#000' }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Usuário</span>
                </button>
              </div>

              {/* Table */}
              <div className="border rounded-xl overflow-hidden bg-black/40" style={{ borderColor: palette.BORDER }}>
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b bg-black/60 text-muted-foreground uppercase text-[10px]" style={{ borderColor: palette.BORDER }}>
                      <th className="p-3">Operador</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Papel</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 font-semibold text-white flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px]"
                            style={{ backgroundColor: palette.PRI_GHO, color: palette.PRI }}
                          >
                            {u.nome.charAt(0).toUpperCase()}
                          </div>
                          <span>{u.nome}</span>
                        </td>
                        <td className="p-3 text-muted-foreground">{u.email}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                              u.papel === 'admin'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            }`}
                          >
                            {u.papel}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                              u.status === 'ativo'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'ativo' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            {u.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                              title={u.status === 'ativo' ? 'Desativar operador' : 'Ativar operador'}
                            >
                              {u.status === 'ativo' ? <UserX className="w-3.5 h-3.5 text-amber-400" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
                            </button>
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-cyan-400 transition-colors"
                              title="Editar operador"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                              title="Excluir operador"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: VOICES MANAGEMENT */}
          {activeTab === 'voices' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs uppercase" style={{ color: palette.WHITE }}>
                    Definição de Vozes para Uso no Sistema
                  </h4>
                  <p className="text-[10px] text-muted-foreground">
                    Voz Fish Audio padrão: <code className="text-cyan-400">{activeVoiceId}</code>
                  </p>
                </div>
                <button
                  onClick={() => setShowVoiceModal(true)}
                  className="px-3.5 py-2 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow"
                  style={{ backgroundColor: palette.PRI, color: '#000' }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Voz</span>
                </button>
              </div>

              {/* Voices Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {voices.map((v) => {
                  const isCurrent = v.voice_id === activeVoiceId || v.padrao === 1;
                  const isTesting = testingVoiceId === v.voice_id;

                  return (
                    <div
                      key={v.id}
                      className="p-4 rounded-xl border bg-black/40 flex flex-col justify-between gap-3 transition-all"
                      style={{
                        borderColor: isCurrent ? palette.PRI : palette.BORDER,
                        backgroundColor: isCurrent ? `${palette.PRI}10` : 'rgba(0,0,0,0.3)',
                      }}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm" style={{ color: isCurrent ? palette.PRI : palette.WHITE }}>
                            {v.nome}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              PADRÃO DO SISTEMA
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                          <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/10 uppercase">
                            {v.provedor}
                          </span>
                          <span>Modelo: {v.modelo}</span>
                          <span>Idioma: {v.idioma}</span>
                        </div>

                        <div className="p-2 rounded bg-black/60 border border-white/5 text-[10px] font-mono break-all text-cyan-300">
                          ID: {v.voice_id}
                        </div>

                        {v.descricao && (
                          <p className="text-[10px] text-muted-foreground leading-normal">
                            {v.descricao}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1">
                        <button
                          type="button"
                          onClick={() => handleTestVoiceAudio(v)}
                          disabled={isTesting}
                          className="px-3 py-1.5 rounded-lg border border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-400 font-bold text-[10px] uppercase flex items-center gap-1.5 transition-all"
                        >
                          <Play className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                          <span>{isTesting ? 'REPRODUZINDO...' : 'TESTAR VOZ'}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultVoice(v)}
                              className="px-2.5 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-bold text-[10px] uppercase transition-all"
                            >
                              Tornar Padrão
                            </button>
                          )}
                          {v.id > 2 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteVoice(v.id)}
                              className="p-1.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                              title="Remover voz"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: MYSQL CONNECTION & SQL SCRIPT */}
          {activeTab === 'database' && (
            <div className="space-y-4">
              {/* Connection Status Box */}
              <div className="p-4 rounded-xl border bg-black/40 space-y-3" style={{ borderColor: palette.BORDER }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="font-bold text-xs uppercase" style={{ color: palette.WHITE }}>
                        Telemetria do Banco de Dados MySQL
                      </h4>
                      <p className="text-[10px] text-muted-foreground">Configurado para: emribeir_jarvismulti</p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                      dbStatus?.mysqlConnected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${dbStatus?.mysqlConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                    <span>{dbStatus?.mysqlConnected ? 'MYSQL ONLINE' : 'COFRE LOCAL OFFLINE ATIVO'}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] pt-1">
                  <div className="p-2.5 rounded bg-black/50 border border-white/5">
                    <span className="text-muted-foreground block">BANCO</span>
                    <span className="font-bold text-white">emribeir_jarvismulti</span>
                  </div>
                  <div className="p-2.5 rounded bg-black/50 border border-white/5">
                    <span className="text-muted-foreground block">USUÁRIO</span>
                    <span className="font-bold text-white">emribeir_romildo</span>
                  </div>
                  <div className="p-2.5 rounded bg-black/50 border border-white/5">
                    <span className="text-muted-foreground block">HOST</span>
                    <span className="font-bold text-white">localhost:3306</span>
                  </div>
                  <div className="p-2.5 rounded bg-black/50 border border-white/5">
                    <span className="text-muted-foreground block">VOZ PADRÃO</span>
                    <span className="font-bold text-cyan-400 truncate block">82d13948027e4...</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-950/20 text-cyan-300 text-[11px] leading-relaxed">
                  <strong>Arquitetura Híbrida Online & Offline:</strong> Quando o app é executado no PC local ou servidor com o MySQL ligado, ele grava e sincroniza tudo na tabela real. Se o MySQL estiver desligado ou offline, o sistema ativa automaticamente o cofre em memória e armazenamento local sem travar nenhuma função!
                </div>
              </div>

              {/* SQL Script block */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase text-muted-foreground">
                    Comando SQL para Criação das Tabelas (database.sql)
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sqlCode);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 2000);
                    }}
                    className="px-3 py-1 rounded border border-white/10 hover:bg-white/10 text-cyan-400 text-[10px] flex items-center gap-1.5 transition-all"
                  >
                    {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSql ? 'COPIADO!' : 'COPIAR SQL'}</span>
                  </button>
                </div>

                <pre className="p-3 rounded-xl border bg-black/80 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-48 border-white/10 select-text leading-relaxed">
                  {sqlCode}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Create/Edit User */}
        {showUserModal && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div
              className="w-full max-w-md rounded-2xl border p-5 bg-[#010d14] space-y-4"
              style={{ borderColor: palette.PRI }}
            >
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: palette.BORDER }}>
                <h4 className="font-bold text-xs uppercase" style={{ color: palette.WHITE }}>
                  {editingUserId ? 'Editar Operador' : 'Cadastrar Novo Operador'}
                </h4>
                <button onClick={() => setShowUserModal(false)} className="text-muted-foreground hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    className="w-full p-2 rounded-lg border bg-black/60 text-white outline-none"
                    style={{ borderColor: palette.BORDER }}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full p-2 rounded-lg border bg-black/60 text-white outline-none"
                    style={{ borderColor: palette.BORDER }}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">
                    {editingUserId ? 'Nova Senha (deixe em branco para manter)' : 'Senha de Acesso'}
                  </label>
                  <input
                    type="password"
                    placeholder={editingUserId ? '••••••••' : 'Digite a senha'}
                    value={formSenha}
                    onChange={(e) => setFormSenha(e.target.value)}
                    className="w-full p-2 rounded-lg border bg-black/60 text-white outline-none"
                    style={{ borderColor: palette.BORDER }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">Papel</label>
                    <select
                      value={formPapel}
                      onChange={(e) => setFormPapel(e.target.value as any)}
                      className="w-full p-2 rounded-lg border bg-black/60 text-white outline-none"
                      style={{ borderColor: palette.BORDER }}
                    >
                      <option value="operador">Operador</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full p-2 rounded-lg border bg-black/60 text-white outline-none"
                      style={{ borderColor: palette.BORDER }}
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: palette.BORDER }}>
                  <button
                    type="button"
                    onClick={() => setShowUserModal(false)}
                    className="px-3 py-1.5 rounded-lg border text-muted-foreground hover:text-white"
                    style={{ borderColor: palette.BORDER }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg font-bold text-xs uppercase"
                    style={{ backgroundColor: palette.PRI, color: '#000' }}
                  >
                    Salvar Operador
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Custom Fish Audio Voice */}
        {showVoiceModal && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div
              className="w-full max-w-md rounded-2xl border p-5 bg-[#010d14] space-y-4"
              style={{ borderColor: palette.PRI }}
            >
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: palette.BORDER }}>
                <h4 className="font-bold text-xs uppercase" style={{ color: palette.WHITE }}>
                  Cadastrar Nova Voz Fish Audio
                </h4>
                <button onClick={() => setShowVoiceModal(false)} className="text-muted-foreground hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveVoice} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Nome da Voz</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: JARVIS Prime PT-BR"
                    value={vNome}
                    onChange={(e) => setVNome(e.target.value)}
                    className="w-full p-2 rounded-lg border bg-black/60 text-white outline-none"
                    style={{ borderColor: palette.BORDER }}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Fish Audio Voice ID (reference_id)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 82d13948027e4be69892dd3d0104e681"
                    value={vId}
                    onChange={(e) => setVId(e.target.value)}
                    className="w-full p-2 rounded-lg border bg-black/60 text-white outline-none font-mono"
                    style={{ borderColor: palette.BORDER }}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Modelo Fish Audio</label>
                  <input
                    type="text"
                    value={vModelo}
                    onChange={(e) => setVModelo(e.target.value)}
                    className="w-full p-2 rounded-lg border bg-black/60 text-white outline-none font-mono"
                    style={{ borderColor: palette.BORDER }}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Descrição</label>
                  <input
                    type="text"
                    placeholder="Tom grave, timbre tático"
                    value={vDesc}
                    onChange={(e) => setVDesc(e.target.value)}
                    className="w-full p-2 rounded-lg border bg-black/60 text-white outline-none"
                    style={{ borderColor: palette.BORDER }}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: palette.BORDER }}>
                  <button
                    type="button"
                    onClick={() => setShowVoiceModal(false)}
                    className="px-3 py-1.5 rounded-lg border text-muted-foreground hover:text-white"
                    style={{ borderColor: palette.BORDER }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg font-bold text-xs uppercase"
                    style={{ backgroundColor: palette.PRI, color: '#000' }}
                  >
                    Salvar Voz
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
