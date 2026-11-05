// Maintenance (master data): one generic searchable table + add/edit modal for each reference list.
// In-use entries can't be deleted (they can be deactivated); duplicates are rejected.
import React, { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Badge, Btn, Card, ConfirmModal, EmptyState, FormField, Icon, IconBtn, Input, Modal, PageHeader, Pager, SearchInput, Select, Tabs, useToast } from '../components/ui.jsx';
import ExportMenu from '../components/ExportMenu.jsx';
import { deleteMaster, saveMaster, usageCount, useStore } from '../store.js';
import { MASTERS, MASTER_LIST } from '../schema.js';
import { byId } from '../lib/data.js';
import { validateMaster } from '../lib/validate.js';
import NotFound from './NotFound.jsx';

export default function Maintenance() {
  const { entity } = useParams();
  if (!entity) return <Navigate to="/maintenance/colleges" replace />;
  return MASTERS[entity] ? <Entity key={entity} entity={entity} /> : <NotFound />;
}

// Display text for one field value of one row
function show(db, f, row) {
  const v = row[f.key];
  if (f.source) return byId(db[f.source], v)?.[f.show || 'name'] || '—';
  if (f.color) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 3, background: v, border: '1px solid #D9DEE4' }} />{v}</span>;
  return v || '—';
}

function Entity({ entity }) {
  const cfg = MASTERS[entity];
  const { db } = useStore();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [edit, setEdit] = useState(null); // item | {} for new
  const [del, setDel] = useState(null);
  const [blocked, setBlocked] = useState(null);

  const rows = useMemo(() => db[entity].filter((r) => !q || cfg.fields.some((f) => String(show(db, { ...f, color: false }, r)).toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => String(a[cfg.fields[0].key]).localeCompare(String(b[cfg.fields[0].key]))), [db, entity, q, cfg]);
  const paged = rows.slice((page - 1) * size, page * size);

  const toggleActive = (item) => { saveMaster(entity, { ...item, active: item.active === false }); toast(`${cfg.singular} ${item.active === false ? 'activated' : 'deactivated'}.`, 'success'); };
  const askDelete = (item) => (usageCount(db, entity, item.id) ? setBlocked(item) : setDel(item));
  const exportSpec = () => ({ title: `Maintenance — ${cfg.title}`, filters: q ? [`Search: “${q}”`] : [], head: [...cfg.fields.map((f) => f.label), 'Status'], rows: rows.map((r) => [...cfg.fields.map((f) => String(show(db, { ...f, color: false }, r))), r.active === false ? 'Inactive' : 'Active']) });

  return (
    <div className="page">
      <PageHeader title="Maintenance" subtitle="Master data that feeds every dropdown in the system." actions={<><ExportMenu build={exportSpec} /><Btn icon="plus" onClick={() => setEdit({})}>Add {cfg.singular.toLowerCase()}</Btn></>} />
      <div style={{ marginBottom: 16 }}><Tabs active={entity} items={MASTER_LIST.map((k) => ({ id: k, label: MASTERS[k].title, to: `/maintenance/${k}` }))} /></div>

      <div className="filter-bar"><SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder={`Search ${cfg.title.toLowerCase()}…`} style={{ flex: '1 1 240px', maxWidth: 420 }} aria-label={`Search ${cfg.title}`} />
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#5C6B7A' }}>{rows.length} of {db[entity].length}</span></div>

      <Card pad={false} style={{ overflow: 'hidden' }}>
        {rows.length === 0 ? <EmptyState icon={cfg.icon} title={q ? 'No matches' : `No ${cfg.title.toLowerCase()} yet`} desc={q ? 'Try a different search.' : `Add the first ${cfg.singular.toLowerCase()}.`} action={!q && <Btn icon="plus" onClick={() => setEdit({})}>Add {cfg.singular.toLowerCase()}</Btn>} />
          : <>
            <div className="tbl-wrap"><table className="tbl">
              <thead><tr>{cfg.fields.map((f) => <th key={f.key}>{f.label.replace(' (optional)', '')}</th>)}<th>In use</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
              <tbody>
                {paged.map((r) => {
                  const used = usageCount(db, entity, r.id);
                  return (
                    <tr key={r.id} style={r.active === false ? { opacity: 0.65 } : undefined}>
                      {cfg.fields.map((f, i) => <td key={f.key} style={i === 0 ? { fontWeight: 600 } : undefined}>{show(db, f, r)}</td>)}
                      <td style={{ color: '#5C6B7A' }}>{used ? `${used} link${used > 1 ? 's' : ''}` : '—'}</td>
                      <td><Badge variant={r.active === false ? 'muted' : 'success'}>{r.active === false ? 'Inactive' : 'Active'}</Badge></td>
                      <td><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <IconBtn icon="edit" label={`Edit ${r[cfg.fields[0].key]}`} color="#1F3A93" onClick={() => setEdit(r)} />
                        <IconBtn icon={r.active === false ? 'check' : 'lock'} label={r.active === false ? 'Activate' : 'Deactivate'} color="#B7791F" onClick={() => toggleActive(r)} />
                        <IconBtn icon="trash" label={`Delete ${r[cfg.fields[0].key]}`} color="#9B1B1B" onClick={() => askDelete(r)} />
                      </div></td>
                    </tr>
                  );
                })}
              </tbody></table></div>
            <Pager total={rows.length} page={page} pageSize={size} onPage={setPage} onSize={(n) => { setSize(n); setPage(1); }} />
          </>}
      </Card>

      {edit && <EditModal key={edit.id || 'new'} entity={entity} item={edit} onClose={() => setEdit(null)} />}

      <ConfirmModal isOpen={!!del} onClose={() => setDel(null)} title={`Delete ${cfg.singular.toLowerCase()}`} message={`Delete “${del?.[cfg.fields[0].key]}”? This cannot be undone.`}
        onConfirm={() => { const res = deleteMaster(entity, del.id); toast(res.ok ? `${cfg.singular} deleted.` : res.error, res.ok ? 'success' : 'error'); }} />
      <Modal isOpen={!!blocked} onClose={() => setBlocked(null)} title="Cannot delete — in use" width={460}
        footer={<><Btn variant="ghost" onClick={() => setBlocked(null)}>Close</Btn>{blocked?.active !== false && <Btn onClick={() => { toggleActive(blocked); setBlocked(null); }}>Deactivate instead</Btn>}</>}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Icon name="alert" size={20} color="#B7791F" />
          <p style={{ fontSize: 14.5, lineHeight: 1.6 }}>“{blocked?.[cfg.fields[0].key]}” is used by {blocked && usageCount(db, entity, blocked.id)} other record(s), so it can’t be deleted. Deactivating hides it from new dropdowns while keeping existing records intact.</p>
        </div>
      </Modal>
    </div>
  );
}

function EditModal({ entity, item, onClose }) {
  const cfg = MASTERS[entity];
  const { db } = useStore();
  const toast = useToast();
  const [form, setForm] = useState(() => ({ color: '#1F3A93', ...item }));
  const [errors, setErrors] = useState({});
  const isNew = !item.id;
  // changing a field resets any field whose options depend on it (e.g. college → course)
  const set = (k, v) => setForm((f) => { const n = { ...f, [k]: v }; cfg.fields.forEach((x) => { if (x.filterBy === k) n[x.key] = ''; }); return n; });

  const save = (e) => {
    e?.preventDefault();
    const clean = { ...form };
    cfg.fields.forEach((f) => { if (typeof clean[f.key] === 'string') clean[f.key] = f.upper ? clean[f.key].trim().toUpperCase() : clean[f.key].trim(); });
    const er = validateMaster(entity, clean, db, item.id);
    setErrors(er);
    if (Object.keys(er).length) { toast('Please fix the highlighted fields.', 'error'); return; }
    const res = saveMaster(entity, { active: true, ...clean });
    if (!res.ok) { setErrors(res.errors); toast(Object.values(res.errors)[0], 'error'); return; }
    toast(`${cfg.singular} ${isNew ? 'added' : 'updated'} successfully.`, 'success');
    onClose();
  };

  const field = (f) => {
    const err = errors[f.key];
    let control;
    if (f.source || f.options) {
      let opts = f.options ? f.options.map((o) => ({ value: o, label: o })) : db[f.source].filter((o) => (f.filterBy ? o[f.filterBy] === form[f.filterBy] : true) && (o.active !== false || o.id === form[f.key])).map((o) => ({ value: o.id, label: o[f.show || 'name'] }));
      control = <Select value={form[f.key] || ''} onChange={(v) => set(f.key, v)} placeholder={f.required ? 'Select…' : 'None'} options={opts} error={err} disabled={f.filterBy && !form[f.filterBy]} />;
    } else if (f.color) control = <input type="color" value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} aria-label={f.label} style={{ width: 64, height: 36, border: '1.5px solid #D9DEE4', borderRadius: 6, padding: 2, background: '#fff' }} />;
    else control = <Input value={form[f.key]} onChange={(v) => set(f.key, v)} placeholder={f.placeholder} error={err} maxLength={f.max} readOnly={entity === 'academicYears' && !isNew} />;
    return <FormField key={f.key} label={f.label} required={f.required} error={err} hint={entity === 'academicYears' && !isNew ? 'The academic-year key cannot be changed once created.' : undefined}>{control}</FormField>;
  };

  return (
    <Modal isOpen onClose={onClose} title={`${isNew ? 'Add' : 'Edit'} ${cfg.singular.toLowerCase()}`} width={480}
      footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save}>{isNew ? 'Add' : 'Save changes'}</Btn></>}>
      <form onSubmit={save} noValidate className="form-stack">
        {cfg.fields.map((f) => field(f))}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
