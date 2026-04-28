'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import { X, Trash2, Minus, Pen, Eraser, Download, RotateCcw } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onInsert: (dataUrl: string) => void;
}

const COLORS = ['#0f0f1a','#ef4444','#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899','#ffffff'];
const SIZES  = [2, 4, 8, 14];

export function DrawingModal({ open, onClose, onInsert }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawing    = useRef(false);
  const lastPos    = useRef({ x: 0, y: 0 });
  const historyRef = useRef<ImageData[]>([]);

  const [tool, setTool]   = useState<'pen'|'eraser'>('pen');
  const [color, setColor] = useState('#0f0f1a');
  const [size, setSize]   = useState(4);

  /* Init canvas */
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width  = canvas.offsetWidth  || 700;
    canvas.height = canvas.offsetHeight || 420;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    historyRef.current = [];
  }, [open]);

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    historyRef.current = [...historyRef.current.slice(-20), ctx.getImageData(0, 0, canvas.width, canvas.height)];
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * scaleX, y: ((e as React.MouseEvent).clientY - rect.top) * scaleY };
  };

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current; if (!canvas) return;
    saveHistory();
    drawing.current = true;
    lastPos.current = getPos(e, canvas);
  }, [saveHistory]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e, canvas);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth   = tool === 'eraser' ? size * 4 : size;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke();
    lastPos.current = pos;
  }, [tool, color, size]);

  const endDraw = useCallback(() => { drawing.current = false; }, []);

  const undo = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const prev = historyRef.current.pop();
    if (prev) ctx.putImageData(prev, 0, 0);
  };

  const clear = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    saveHistory();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleInsert = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    onInsert(url);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card-bg)', borderRadius: 16, overflow: 'hidden',
          width: 'min(800px, 96vw)', boxShadow: 'var(--shadow-lg)',
          display: 'flex', flexDirection: 'column', maxHeight: '90vh',
          animation: 'scaleIn 0.22s ease',
        }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.1rem', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--foreground)' }}>✏️ Drawing Canvas</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4 }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', background: 'var(--background)' }}>
          {/* Tool */}
          {[{ t: 'pen' as const, Icon: Pen, label: 'Pen' }, { t: 'eraser' as const, Icon: Eraser, label: 'Eraser' }].map(({ t, Icon, label }) => (
            <button key={t} onClick={() => setTool(t)} title={label}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.7rem',
                borderRadius: 8, border: '1px solid', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                borderColor: tool === t ? 'var(--primary)' : 'var(--border)',
                background: tool === t ? 'var(--primary)' : 'transparent',
                color: tool === t ? 'white' : 'var(--foreground)',
              }}>
              <Icon style={{ width: 14, height: 14 }} /> {label}
            </button>
          ))}

          <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 0.25rem' }} />

          {/* Colors */}
          {COLORS.map(c => (
            <button key={c} onClick={() => { setColor(c); setTool('pen'); }}
              title={c}
              style={{
                width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer',
                border: color === c && tool === 'pen' ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                outline: 'none', transition: 'transform 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.2)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            />
          ))}

          <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 0.25rem' }} />

          {/* Sizes */}
          {SIZES.map(s => (
            <button key={s} onClick={() => setSize(s)} title={`${s}px`}
              style={{
                width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid', cursor: 'pointer',
                borderColor: size === s ? 'var(--primary)' : 'var(--border)',
                background: size === s ? 'rgba(99,102,241,0.1)' : 'transparent',
              }}>
              <div style={{ width: Math.max(4, s * 1.2), height: Math.max(4, s * 1.2), borderRadius: '50%', background: 'var(--foreground)' }} />
            </button>
          ))}

          <div style={{ flex: 1 }} />

          {/* Actions */}
          <button onClick={undo} title="Undo"
            style={{ padding: '0.35rem 0.6rem', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--foreground)' }}>
            <RotateCcw style={{ width: 13, height: 13 }} /> Undo
          </button>
          <button onClick={clear} title="Clear"
            style={{ padding: '0.35rem 0.6rem', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--foreground)' }}>
            <Trash2 style={{ width: 13, height: 13 }} /> Clear
          </button>
        </div>

        {/* Canvas */}
        <div ref={containerRef} style={{ flex: 1, background: '#ffffff', overflow: 'hidden', position: 'relative', minHeight: 360 }}>
          <canvas ref={canvasRef}
            style={{ display: 'block', width: '100%', height: '100%', cursor: tool === 'eraser' ? 'cell' : 'crosshair', touchAction: 'none' }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', padding: '0.85rem 1.1rem', borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose}
            style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>
            Cancel
          </button>
          <button onClick={handleInsert}
            style={{ padding: '0.5rem 1.2rem', borderRadius: 8, border: 'none', background: 'var(--primary)', color: 'white', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 600 }}>
            Insert into page
          </button>
        </div>
      </div>
    </div>
  );
}
