// "Export" button with Excel / PDF choices. `build()` returns { title, filters, head, rows, totals? } at click time.
import React, { useEffect, useRef, useState } from 'react';
import { Btn, Icon, useToast } from './ui.jsx';
import { exportTable } from '../lib/export.js';

export default function ExportMenu({ build, variant = 'ghost', size = 'md', label = 'Export' }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);
  const toast = useToast();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const run = async (fmt) => {
    setOpen(false);
    const spec = build();
    if (!spec.rows.length) { toast('There is nothing to export for the current selection.', 'warning'); return; }
    setBusy(true);
    try {
      await exportTable(spec, fmt);
      toast(fmt === 'xlsx' ? 'Excel file downloaded.' : 'PDF is ready — choose “Save as PDF” in the print dialog.', 'success');
    } catch (e) {
      toast(`Export failed: ${e.message || 'unexpected error'}`, 'error');
    } finally { setBusy(false); }
  };

  const item = { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, textAlign: 'left', color: '#1F2933' };
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <Btn variant={variant} size={size} icon="download" disabled={busy} onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu">{busy ? 'Exporting…' : label}<Icon name="chevron-down" size={12} /></Btn>
      {open && (
        <div role="menu" style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', minWidth: 180, background: '#fff', border: '1px solid #D9DEE4', borderRadius: 8, boxShadow: '0 8px 28px rgba(0,0,0,.14)', zIndex: 250, overflow: 'hidden' }}>
          <button role="menuitem" type="button" style={item} onClick={() => run('xlsx')}><Icon name="download" size={14} color="#2E7D4F" />Excel (.xlsx)</button>
          <button role="menuitem" type="button" style={item} onClick={() => run('pdf')}><Icon name="printer" size={14} color="#9B1B1B" />PDF (print)</button>
        </div>
      )}
    </div>
  );
}
