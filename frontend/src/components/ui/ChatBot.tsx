import { useState, useEffect, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './ChatBot.css';

/* ── Types ─────────────────────────────────────────────────────────────── */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatContext {
  evento_titulo?: string;
  cupos_disponibles?: number;
  precio?: number;
  fecha?: string;
  lugar?: string;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

let msgCounter = 0;
const newId = () => `msg-${++msgCounter}-${Date.now()}`;

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: '¡Hola! Soy **EventBot** 🎟️ Tu asistente de EventosPro. Puedo ayudarte a:\n- Inscribirte en eventos\n- Responder preguntas sobre la plataforma\n- Guiarte en el proceso de pago\n\n¿En qué te puedo ayudar hoy?',
  timestamp: new Date(),
};

function renderContent(text: string) {
  // Markdown básico: **negrita**, saltos de línea, listas
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n- /g, '\n• ')
    .split('\n')
    .map((line, i) => `<span key="${i}">${line}</span>`)
    .join('<br/>');
}

/* ── Componente ─────────────────────────────────────────────────────────── */

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { user } = useAuth();

  // Intentar obtener contexto del evento si estamos en una página de evento
  const pathParts = window.location.pathname.split('/');
  const eventoIdFromPath = pathParts[2] && pathParts[1] === 'eventos' ? pathParts[2] : undefined;

  // Auto-scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Foco al abrir
  useEffect(() => {
    if (open) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && open) setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const buildContext = (): ChatContext => {
    const ctx: ChatContext = {};
    // El frontend puede enriquecer el contexto con datos de la página actual
    // sin exponer nada sensible del backend
    return ctx;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: newId(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Historial para el LLM (excluye el mensaje de bienvenida)
    const history = messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
      const res = await fetch(`${API_BASE}/ia/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          context: buildContext(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.detail || `Error ${res.status}`;
        // 503 = servicio no disponible (sin saldo u otro)
        if (res.status === 503 || res.status === 402) {
          throw new Error('El asistente no está disponible temporalmente. Por favor intenta más tarde.');
        }
        throw new Error(errMsg);
      }
      const data = await res.json();

      const botMsg: Message = {
        id: newId(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);

      // Ejecutar acción sugerida por el LLM
      if (data.action === 'navigate_to_inscripcion' && eventoIdFromPath) {
        setTimeout(() => {
          setOpen(false);
          navigate(`/eventos/${eventoIdFromPath}/inscripcion`);
        }, 1200);
      } else if (data.action === 'navigate_to_eventos') {
        setTimeout(() => {
          setOpen(false);
          navigate('/eventos');
        }, 1200);
      }

      if (!open) setHasUnread(true);
    } catch {
      setMessages(prev => [...prev, {
        id: newId(),
        role: 'assistant',
        content: 'Lo siento, tuve un problema al conectarme. Por favor intenta de nuevo.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([WELCOME]);
    setInput('');
    inputRef.current?.focus();
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {/* ── Botón flotante ─────────────────────────────────────────────── */}
      <button
        type="button"
        className={`chatbot-trigger${hasUnread ? ' chatbot-trigger--unread' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Cerrar asistente virtual' : 'Abrir asistente virtual EventBot'}
        aria-expanded={open}
        aria-haspopup="dialog"
        id="chatbot-trigger"
      >
        <span className="chatbot-trigger__icon" aria-hidden="true">
          {open ? '✕' : '🤖'}
        </span>
        {hasUnread && (
          <span className="chatbot-trigger__badge" aria-label="Nuevo mensaje">1</span>
        )}
      </button>

      {/* ── Panel de chat ──────────────────────────────────────────────── */}
      {open && (
        <div
          className="chatbot-panel animate-slide-up"
          role="dialog"
          aria-label="Asistente virtual EventBot"
          aria-modal="false"
          ref={panelRef}
        >
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header__info">
              <span className="chatbot-header__avatar" aria-hidden="true">🤖</span>
              <div>
                <p className="chatbot-header__name">EventBot</p>
                <p className="chatbot-header__status">
                  <span className="chatbot-header__dot" aria-hidden="true" />
                  En línea
                </p>
              </div>
            </div>
            <div className="chatbot-header__actions">
              <button
                type="button"
                className="chatbot-icon-btn"
                onClick={clearChat}
                aria-label="Limpiar conversación"
                title="Nueva conversación"
              >
                🗑️
              </button>
              <button
                type="button"
                className="chatbot-icon-btn"
                onClick={() => setOpen(false)}
                aria-label="Cerrar chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Mensajes */}
          <div
            className="chatbot-messages"
            role="log"
            aria-live="polite"
            aria-label="Conversación con EventBot"
            aria-atomic="false"
            aria-relevant="additions"
          >
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`chatbot-msg chatbot-msg--${msg.role}`}
              >
                {msg.role === 'assistant' && (
                  <span className="chatbot-msg__avatar" aria-hidden="true">🤖</span>
                )}
                <div className="chatbot-msg__bubble">
                  <p
                    className="chatbot-msg__text"
                    dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                  />
                  <time
                    className="chatbot-msg__time"
                    dateTime={msg.timestamp.toISOString()}
                    aria-label={`Enviado a las ${formatTime(msg.timestamp)}`}
                  >
                    {formatTime(msg.timestamp)}
                  </time>
                </div>
                {msg.role === 'user' && (
                  <span className="chatbot-msg__avatar chatbot-msg__avatar--user" aria-hidden="true">
                    {user?.nombre?.charAt(0).toUpperCase() ?? '👤'}
                  </span>
                )}
              </div>
            ))}

            {/* Indicador de carga */}
            {loading && (
              <div className="chatbot-msg chatbot-msg--assistant" role="status" aria-label="EventBot está escribiendo">
                <span className="chatbot-msg__avatar" aria-hidden="true">🤖</span>
                <div className="chatbot-msg__bubble chatbot-msg__bubble--typing">
                  <span className="chatbot-typing">
                    <span /><span /><span />
                  </span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Sugerencias rápidas */}
          {messages.length <= 1 && (
            <div className="chatbot-suggestions" aria-label="Preguntas frecuentes">
              {[
                '¿Cómo me inscribo a un evento?',
                '¿Cómo pago con transferencia?',
                '¿Qué es el boleto digital?',
                'Ver eventos disponibles',
              ].map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className="chatbot-suggestion"
                  onClick={() => sendMessage(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form className="chatbot-form" onSubmit={handleSubmit} aria-label="Escribir mensaje">
            <textarea
              ref={inputRef}
              className="chatbot-input"
              placeholder="Escribe tu pregunta... (Enter para enviar)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              maxLength={800}
              disabled={loading}
              aria-label="Mensaje para EventBot"
              aria-multiline="true"
            />
            <button
              type="submit"
              className="chatbot-send"
              disabled={!input.trim() || loading}
              aria-label="Enviar mensaje"
            >
              <span aria-hidden="true">➤</span>
            </button>
          </form>
          <p className="chatbot-disclaimer">
            EventBot puede cometer errores. Verifica info importante.
          </p>
        </div>
      )}
    </>
  );
}
