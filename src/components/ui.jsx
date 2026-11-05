// Shared UI kit — ported from the design's plm-ui.jsx (same colors, radii, spacing), plus a few additions.
import React, { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Chart from 'chart.js/auto';

// ─── Icons (one consistent 24px line set) ──────────────────────────────────────
const P = {
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  'book-open': '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  'graduation-cap': '<path d="M22 10v6"/><path d="M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 0 3 3 6 3s6-3 6-3v-5"/>',
  'bar-chart': '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  edit: '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  'chevron-right': '<polyline points="9 18 15 12 9 6"/>', 'chevron-down': '<polyline points="6 9 12 15 18 9"/>', 'chevron-left': '<polyline points="15 18 9 12 15 6"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/>',
  'arrow-up': '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>',
  'arrow-down': '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>',
  'arrow-left': '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
  export: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
  menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  key: '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
  undo: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
  printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
};
export const Icon = ({ name, size = 16, color = 'currentColor', strokeWidth = 1.75, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }} dangerouslySetInnerHTML={{ __html: P[name] || '' }} />
);

// ─── Badge ─────────────────────────────────────────────────────────────────────
const BADGES = {
  default: ['#E9EDF7', '#1F3A93'], success: ['#E8F5EE', '#2E7D4F'], warning: ['#FEF3E2', '#B7791F'], error: ['#F7E5E5', '#9B1B1B'],
  funded: ['#E8F5EE', '#2E7D4F'], unfunded: ['#F0F2F4', '#5C6B7A'], gold: ['#F6F0DA', '#A6841C'], muted: ['#F0F2F4', '#5C6B7A'],
};
export const Badge = ({ children, variant = 'default', color, style }) => {
  const [bg, fg] = color ? [`${color}1F`, color] : BADGES[variant] || BADGES.default;
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: bg, color: fg, letterSpacing: '0.01em', whiteSpace: 'nowrap', ...style }}>{children}</span>;
};
// Indexing badge: text label + color, never color alone (a11y).
export const IndexBadge = ({ idx }) => (idx ? <Badge color={idx.id === 'scopus' ? '#A6841C' : idx.color}>{idx.name}</Badge> : <span style={{ color: '#9CA3AF' }}>—</span>);

// ─── Button ────────────────────────────────────────────────────────────────────
const SIZES = { sm: { fontSize: 13, padding: '5px 12px' }, md: { fontSize: 14, padding: '8px 16px' }, lg: { fontSize: 15, padding: '10px 20px' } };
const VARIANTS = {
  primary: { background: '#1F3A93', color: '#fff', border: '1.5px solid #1F3A93' },
  secondary: { background: '#fff', color: '#1F3A93', border: '1.5px solid #1F3A93' },
  ghost: { background: '#fff', color: '#5C6B7A', border: '1.5px solid #D9DEE4' },
  danger: { background: '#9B1B1B', color: '#fff', border: '1.5px solid #9B1B1B' },
  success: { background: '#2E7D4F', color: '#fff', border: '1.5px solid #2E7D4F' },
  link: { background: 'transparent', color: '#1F3A93', border: '1.5px solid transparent', padding: '4px 6px' },
};
export const Btn = ({ children, variant = 'primary', size = 'md', icon, onClick, disabled, type = 'button', style, title, as: As, to, ...rest }) => {
  const st = { display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer', borderRadius: 6,
    whiteSpace: 'nowrap', textDecoration: 'none', ...SIZES[size], ...VARIANTS[variant], opacity: disabled ? 0.55 : 1, ...style };
  const inner = <>{icon && <Icon name={icon} size={14} />}{children}</>;
  if (to) return <Link to={to} className="btn" style={st} title={title} {...rest}>{inner}</Link>;
  return <button type={type} className="btn" onClick={onClick} disabled={disabled} style={st} title={title} {...rest}>{inner}</button>;
};
export const IconBtn = ({ icon, label, onClick, color = '#5C6B7A', to, disabled }) => {
  const st = { background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', padding: '6px 7px', borderRadius: 5, color, display: 'inline-flex', opacity: disabled ? 0.4 : 1 };
  return to ? <Link to={to} className="btn" title={label} aria-label={label} style={st}><Icon name={icon} size={15} /></Link>
    : <button type="button" className="btn" title={label} aria-label={label} onClick={onClick} disabled={disabled} style={st}><Icon name={icon} size={15} /></button>;
};

// ─── Inputs ────────────────────────────────────────────────────────────────────
const inputStyle = { width: '100%', fontFamily: 'inherit', fontSize: 14, color: '#1F2933', background: '#fff', border: '1.5px solid #D9DEE4', borderRadius: 6, padding: '8px 12px', boxSizing: 'border-box' };
const ring = (error) => ({ borderColor: error ? '#9B1B1B' : undefined });

export const FormField = ({ label, required, error, hint, children, style }) => {
  const id = useId();
  const child = React.isValidElement(children) ? React.cloneElement(children, { id, 'aria-invalid': !!error || undefined, 'aria-describedby': error ? `${id}-e` : undefined }) : children;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, ...style }}>
      {label && <label htmlFor={id} style={{ fontSize: 13, fontWeight: 500, color: '#1F2933' }}>{label}{required && <span style={{ color: '#9B1B1B', marginLeft: 2 }} aria-hidden="true">*</span>}</label>}
      {child}
      {hint && !error && <span style={{ fontSize: 12, color: '#5C6B7A' }}>{hint}</span>}
      {error && <span id={`${id}-e`} role="alert" style={{ fontSize: 12, color: '#9B1B1B', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="alert" size={12} color="#9B1B1B" />{error}</span>}
    </div>
  );
};

export const Input = ({ value, onChange, placeholder, type = 'text', error, readOnly, disabled, prefix, ...rest }) => (
  <div style={{ position: 'relative' }}>
    {prefix && <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#5C6B7A', fontSize: 13 }}>{prefix}</span>}
    <input className="field" type={type} value={value ?? ''} onChange={(e) => onChange && onChange(e.target.value)} placeholder={placeholder} readOnly={readOnly} disabled={disabled}
      style={{ ...inputStyle, paddingLeft: prefix ? 44 : 12, ...ring(error), background: readOnly || disabled ? '#F7F8FA' : '#fff' }} {...rest} />
  </div>
);

export const Select = ({ value, onChange, options, placeholder, error, disabled, ...rest }) => (
  <div style={{ position: 'relative' }}>
    <select className="field" value={value ?? ''} onChange={(e) => onChange(e.target.value)} disabled={disabled}
      style={{ ...inputStyle, appearance: 'none', paddingRight: 32, cursor: disabled ? 'not-allowed' : 'pointer', ...ring(error), background: disabled ? '#F7F8FA' : '#fff' }} {...rest}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#5C6B7A' }}><Icon name="chevron-down" size={14} /></span>
  </div>
);

export const Textarea = ({ value, onChange, placeholder, rows = 3, error, ...rest }) => (
  <textarea className="field" value={value ?? ''} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, ...ring(error) }} {...rest} />
);

// Compact select used in filter bars (matches the design's inline filter selects).
export const FilterSelect = ({ value, onChange, options, placeholder, label, style }) => (
  <select className="field filter-select" aria-label={label || placeholder} value={value} onChange={(e) => onChange(e.target.value)}
    style={{ color: value ? '#1F2933' : '#5C6B7A', ...style }}>
    <option value="">{placeholder}</option>
    {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
  </select>
);

export const SearchInput = ({ value, onChange, placeholder, style, size = 13, ...rest }) => (
  <div style={{ position: 'relative', ...style }}>
    <Icon name="search" size={size + 1} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
    <input className="field" type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', paddingLeft: 32, paddingRight: 10, paddingTop: 7, paddingBottom: 7, border: '1.5px solid #D9DEE4', borderRadius: 6, fontSize: size, color: '#1F2933', boxSizing: 'border-box', background: '#fff' }} {...rest} />
  </div>
);

// Multi-select checkbox dropdown with a filter box and removable chips.
export const MultiSelect = ({ value = [], onChange, options, placeholder, error, disabled, id }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const label = (v) => options.find((o) => o.value === v)?.label || v;
  const shown = options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div ref={ref} style={{ position: 'relative' }} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
      <button id={id} type="button" disabled={disabled} onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="listbox" className="field"
        style={{ ...inputStyle, textAlign: 'left', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, ...ring(error), background: disabled ? '#F7F8FA' : '#fff' }}>
        <span style={{ color: value.length ? '#1F2933' : '#9CA3AF', fontSize: 14 }}>{value.length ? `${value.length} selected` : placeholder}</span>
        <Icon name="chevron-down" size={14} color="#5C6B7A" />
      </button>
      {value.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          {value.map((v) => (
            <span key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#E9EDF7', color: '#1F3A93', borderRadius: 4, padding: '2px 4px 2px 8px', fontSize: 12.5, fontWeight: 500 }}>
              {label(v)}
              {!disabled && <button type="button" aria-label={`Remove ${label(v)}`} onClick={() => toggle(v)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 2, color: '#1F3A93' }}><Icon name="x" size={12} /></button>}
            </span>
          ))}
        </div>
      )}
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1.5px solid #D9DEE4', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', zIndex: 200 }}>
          <div style={{ padding: 8, borderBottom: '1px solid #F0F2F4' }}><SearchInput value={q} onChange={setQ} placeholder="Filter list…" autoFocus /></div>
          <div role="listbox" aria-multiselectable="true" style={{ maxHeight: 200, overflowY: 'auto' }}>
            {shown.length === 0 && <div style={{ padding: '10px 12px', fontSize: 13, color: '#5C6B7A' }}>No matches</div>}
            {shown.map((o) => (
              <label key={o.value} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={value.includes(o.value)} onChange={() => toggle(o.value)} style={{ accentColor: '#1F3A93' }} />
                {o.label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Modal & Drawer (Esc closes; focus moves in) ───────────────────────────────
function useOverlay(isOpen, onClose) {
  const ref = useRef(null);
  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.activeElement;
    document.body.style.overflow = 'hidden';
    const first = ref.current?.querySelector('input:not([type=hidden]):not([disabled]), select, textarea, button.field');
    (first || ref.current)?.focus();
    const k = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', k); prev?.focus?.(); };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  return ref;
}

export const Modal = ({ isOpen, onClose, title, children, footer, width = 480 }) => {
  const ref = useOverlay(isOpen, onClose);
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,20,40,0.45)' }} onClick={onClose} />
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} style={{ position: 'relative', background: '#fff', borderRadius: 8, width, maxWidth: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', outline: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #D9DEE4' }}>
          <h3 style={{ fontSize: 17, fontWeight: 600 }}>{title}</h3>
          <IconBtn icon="x" label="Close" onClick={onClose} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>{children}</div>
        {footer && <div style={{ padding: '14px 24px', borderTop: '1px solid #D9DEE4', display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>{footer}</div>}
      </div>
    </div>
  );
};

export const Drawer = ({ isOpen, onClose, title, children, footer, width = 520 }) => {
  const ref = useOverlay(isOpen, onClose);
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,20,40,0.45)', zIndex: 1000, opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none', transition: 'opacity 0.2s' }} onClick={onClose} />
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} aria-hidden={!isOpen} tabIndex={-1}
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: `min(${width}px, 100vw)`, background: '#fff', zIndex: 1001, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)', visibility: isOpen ? 'visible' : 'hidden', transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1), visibility 0.25s', outline: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #D9DEE4', flexShrink: 0 }}>
          <h3 style={{ fontSize: 17, fontWeight: 600 }}>{title}</h3>
          <IconBtn icon="x" label="Close" onClick={onClose} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>{isOpen && children}</div>
        {footer && <div style={{ padding: '14px 24px', borderTop: '1px solid #D9DEE4', display: 'flex', gap: 8, justifyContent: 'flex-end', flexShrink: 0, background: '#fff' }}>{footer}</div>}
      </div>
    </>
  );
};

// ─── Toasts ────────────────────────────────────────────────────────────────────
const ToastCtx = createContext(() => {});
const TC = { success: ['#2E7D4F', '#E8F5EE', 'check'], error: ['#9B1B1B', '#F7E5E5', 'alert'], warning: ['#B7791F', '#FEF3E2', 'alert'], info: ['#1F3A93', '#E9EDF7', 'info'] };
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const remove = (id) => setToasts((p) => p.filter((t) => t.id !== id));
  const toast = useCallback((message, type = 'info', ms = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => remove(id), ms);
  }, []);
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div aria-live="polite" style={{ position: 'fixed', bottom: 20, right: 20, left: 20, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, zIndex: 9999, pointerEvents: 'none' }}>
        {toasts.map((t) => {
          const [c, bg, ic] = TC[t.type] || TC.info;
          return (
            <div key={t.id} role="status" style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'flex-start', gap: 10, background: bg, border: `1.5px solid ${c}33`, borderLeft: `3px solid ${c}`, borderRadius: 6, padding: '12px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', minWidth: 260, maxWidth: 400 }}>
              <Icon name={ic} size={16} color={c} style={{ marginTop: 1 }} />
              <div style={{ flex: 1, fontSize: 14, lineHeight: 1.4 }}>{t.message}</div>
              <button type="button" aria-label="Dismiss" onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5C6B7A', display: 'flex', padding: 0 }}><Icon name="x" size={14} /></button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
};
export const useToast = () => useContext(ToastCtx);

// ─── Cards, headers, states ────────────────────────────────────────────────────
export const Card = ({ children, style, pad = true, ...rest }) => <div style={{ background: '#fff', border: '1px solid #D9DEE4', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: pad ? '20px 22px' : 0, minWidth: 0, ...style }} {...rest}>{children}</div>;
export const CardTitle = ({ title, sub, right }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 14 }}>
    <div><div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>{sub && <div style={{ fontSize: 12, color: '#5C6B7A', marginTop: 1 }}>{sub}</div>}</div>{right}
  </div>
);

export const MetricCard = ({ label, value, icon, iconColor = '#1F3A93', sub, to }) => {
  const body = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#5C6B7A' }}>{label}</span>
        <span style={{ background: `${iconColor}14`, borderRadius: 8, padding: '6px 7px', display: 'flex' }}><Icon name={icon} size={16} color={iconColor} /></span>
      </div>
      <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#5C6B7A' }}>{sub}</div>}
    </>
  );
  const st = { background: '#fff', border: '1px solid #D9DEE4', borderRadius: 8, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0, color: 'inherit', textDecoration: 'none' };
  return to ? <Link to={to} className="metric-link" style={st}>{body}</Link> : <div style={st}>{body}</div>;
};

export const EmptyState = ({ icon = 'layers', title, desc, action }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 24px', gap: 12, color: '#5C6B7A', textAlign: 'center' }}>
    <div style={{ background: '#F0F2F4', borderRadius: 12, padding: 18, marginBottom: 4 }}><Icon name={icon} size={28} color="#5C6B7A" /></div>
    <div style={{ fontSize: 16, fontWeight: 600, color: '#1F2933' }}>{title}</div>
    {desc && <div style={{ fontSize: 14, maxWidth: 360, lineHeight: 1.5 }}>{desc}</div>}
    {action}
  </div>
);

export const PageHeader = ({ title, subtitle, actions, back }) => (
  <div style={{ marginBottom: 20 }}>
    {back && <Link to={back.to} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#1F3A93', textDecoration: 'none', marginBottom: 8, fontWeight: 500 }}><Icon name="arrow-left" size={14} />{back.label}</Link>}
    <div className="page-head">
      <div style={{ minWidth: 0 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.25, fontFamily: "'Source Serif 4', serif" }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 14, color: '#5C6B7A', marginTop: 3 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  </div>
);

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', danger = true }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} width={420}
    footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Btn></>}>
    <p style={{ fontSize: 15, lineHeight: 1.6 }}>{message}</p>
  </Modal>
);

// Tabs row (reports, maintenance, admin). Items: { id, label, to? }.
export const Tabs = ({ items, active, onChange }) => (
  <div className="tabs" role="tablist">
    {items.map((t) => {
      const on = t.id === active;
      const st = { padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: on ? 600 : 400, background: on ? '#1F3A93' : 'transparent', color: on ? '#fff' : '#5C6B7A', textDecoration: 'none', whiteSpace: 'nowrap' };
      return t.to ? <Link key={t.id} to={t.to} role="tab" aria-selected={on} style={st}>{t.label}</Link>
        : <button key={t.id} type="button" role="tab" aria-selected={on} onClick={() => onChange(t.id)} style={st}>{t.label}</button>;
    })}
  </div>
);

export const Pager = ({ total, page, pageSize, onPage, onSize }) => {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  const btn = (on, dis) => ({ padding: '5px 10px', border: '1.5px solid', borderColor: on ? '#1F3A93' : '#D9DEE4', borderRadius: 5, background: on ? '#1F3A93' : '#fff', color: on ? '#fff' : dis ? '#C0C6CE' : '#1F2933', fontFamily: 'inherit', fontSize: 13, fontWeight: on ? 600 : 400, cursor: dis ? 'not-allowed' : 'pointer', display: 'flex' });
  return (
    <div className="pager">
      <span style={{ fontSize: 13, color: '#5C6B7A' }}>Showing {from}–{Math.min(page * pageSize, total)} of {total}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        {onSize && <select className="field" aria-label="Rows per page" value={pageSize} onChange={(e) => onSize(+e.target.value)} style={{ fontSize: 13, padding: '5px 8px', border: '1.5px solid #D9DEE4', borderRadius: 5, marginRight: 8, background: '#fff' }}>{[10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}</select>}
        <button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => onPage(page - 1)} style={btn(false, page === 1)}><Icon name="chevron-left" size={15} /></button>
        {nums.map((n, i) => (
          <React.Fragment key={n}>
            {i > 0 && n - nums[i - 1] > 1 && <span style={{ color: '#9CA3AF' }}>…</span>}
            <button type="button" aria-label={`Page ${n}`} aria-current={n === page ? 'page' : undefined} onClick={() => onPage(n)} style={btn(n === page)}>{n}</button>
          </React.Fragment>
        ))}
        <button type="button" aria-label="Next page" disabled={page === pages} onClick={() => onPage(page + 1)} style={btn(false, page === pages)}><Icon name="chevron-right" size={15} /></button>
      </div>
    </div>
  );
};

// Chart.js wrapper. `summary` is read by screen readers (charts need a text alternative).
export const ChartCanvas = ({ type, data, options, height = 220, summary }) => {
  const ref = useRef(null);
  const key = JSON.stringify([type, data, options]);
  useEffect(() => {
    const font = { family: "'Source Sans 3', sans-serif", size: 12 };
    const axis = { grid: { color: '#F0F2F4' }, ticks: { font, color: '#5C6B7A', precision: 0 } };
    const base = type === 'doughnut' ? {} : { scales: { x: { ...axis, grid: { display: false } }, y: { ...axis, beginAtZero: true } } };
    const chart = new Chart(ref.current, { type, data, options: { responsive: true, maintainAspectRatio: false, ...base, ...options,
      plugins: { legend: { display: !!(options?.plugins?.legend?.display), labels: { font, color: '#5C6B7A', usePointStyle: true, padding: 14 }, ...(options?.plugins?.legend || {}) } } } });
    return () => chart.destroy();
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return <div style={{ height, position: 'relative' }}><canvas ref={ref} role="img" aria-label={summary} /></div>;
};
