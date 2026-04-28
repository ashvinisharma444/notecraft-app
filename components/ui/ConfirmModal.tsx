'use client';
import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open, title, message,
  confirmLabel = 'Delete', cancelLabel = 'Cancel',
  danger = true, onConfirm, onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => confirmRef.current?.focus(), 50);
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onCancel();
        if (e.key === 'Enter')  onConfirm();
      };
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    }
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        {/* Icon + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          {danger && (
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(239,68,68,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <AlertTriangle style={{ width: 20, height: 20, color: '#ef4444' }} />
            </div>
          )}
          <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0, color: 'var(--foreground)' }}>{title}</h3>
        </div>

        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0 0 1.5rem', lineHeight: 1.6 }}>{message}</p>

        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--foreground)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              fontWeight: 500,
            }}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 8,
              border: 'none',
              background: danger ? '#ef4444' : 'var(--primary)',
              color: 'white',
              fontSize: '0.875rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
