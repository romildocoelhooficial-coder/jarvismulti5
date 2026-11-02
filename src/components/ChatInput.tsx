import React, { useState, useRef } from 'react';
import { Send, Mic, MicOff, Paperclip, Sparkles, Volume2, Radio } from 'lucide-react';
import { Palette } from '../constants/theme';

interface ChatInputProps {
  palette: Palette;
  isListening: boolean;
  assistantName: string;
  onSend: (text: string) => void;
  onToggleMic: () => void;
  onWake: () => void;
  onAttachFile: (file: File) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  palette,
  isListening,
  assistantName,
  onSend,
  onToggleMic,
  onWake,
  onAttachFile,
}) => {
  const [input, setInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onAttachFile(e.target.files[0]);
    }
  };

  const QUICK_COMMANDS = [
    { label: '👁️ Câmera & Visão', cmd: 'Ativar câmera e interpretar o que você está vendo' },
    { label: '📁 Pastas do PC', cmd: 'Buscar em pastas locais do computador' },
    { label: '🎬 Projetar Vídeo HUD', cmd: 'Projetar vídeo no painel central do HUD' },
    { label: '🌐 Busca na Internet', cmd: 'Pesquisar na internet sobre as novidades do Google AI Studio' },
    { label: '🐍 Preciso de Python?', cmd: 'JARVIS, preciso instalar o python para usar o sistema?' },
    { label: '👤 Me Chame de...', cmd: 'JARVIS, me chame de Comandante' },
    { label: '⚡ Diagnóstico', cmd: 'Verificar telemetria e diagnósticos de hardware' },
  ];

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Quick Action Suggestion Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] no-scrollbar">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono flex items-center gap-1 flex-shrink-0">
          <Sparkles className="w-3 h-3 text-amber-400" /> DIRETIVA:
        </span>
        {QUICK_COMMANDS.map((qc, i) => (
          <button
            key={i}
            onClick={() => onSend(qc.cmd)}
            className="flex-shrink-0 px-2.5 py-1 rounded-full border bg-black/40 hover:bg-white/10 text-muted-foreground hover:text-white transition-all text-[10px] font-mono whitespace-nowrap"
            style={{ borderColor: palette.BORDER }}
          >
            {qc.label}
          </button>
        ))}
      </div>

      {/* Main Input Form */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 p-1.5 rounded-xl border backdrop-blur-md"
        style={{
          backgroundColor: `${palette.PANEL2}ee`,
          borderColor: palette.BORDER_B,
        }}
      >
        <button
          type="button"
          onClick={onWake}
          className="px-2.5 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase border transition-all flex items-center gap-1 flex-shrink-0"
          style={{
            backgroundColor: palette.PRI_GHO,
            borderColor: palette.BORDER_A,
            color: palette.PRI,
          }}
          title="Simular comando de ativação 'Hey Jarvis'"
        >
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>WAKE</span>
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Instrua o ${assistantName} ou fale pelo microfone em Português… (Segure Ctrl+Espaço)`}
          className="flex-1 bg-transparent px-3 py-2 text-xs outline-none font-mono"
          style={{ color: palette.WHITE }}
        />

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
          title="Anexar arquivo para análise"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggleMic}
          className="p-2 rounded-lg border transition-all flex items-center justify-center"
          style={{
            backgroundColor: isListening ? `${palette.RED}33` : palette.BAR_BG,
            borderColor: isListening ? palette.RED : palette.BORDER,
            color: isListening ? palette.RED : palette.TEXT,
          }}
          title={isListening ? 'Parar captura de voz' : 'Iniciar reconhecimento de voz em Português'}
        >
          {isListening ? (
            <Mic className="w-4 h-4 animate-bounce" />
          ) : (
            <MicOff className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        <button
          type="submit"
          disabled={!input.trim()}
          className="px-3.5 py-2 rounded-lg font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-1 disabled:opacity-40"
          style={{
            backgroundColor: palette.PRI,
            color: '#000',
          }}
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">ENVIAR</span>
        </button>
      </form>
    </div>
  );
};
