// Administration: Users & Roles, Audit Log (read-only), System Settings.
import React, { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Badge, Btn, Card, CardTitle, ConfirmModal, EmptyState, FilterSelect, FormField, IconBtn, Input, Modal, PageHeader, Pager, SearchInput, Select, Tabs, useToast } from '../components/ui.jsx';
import ExportMenu from '../components/ExportMenu.jsx';
import { getUser, resetDemoData, resetPassword, saveSettings, saveUser, useStore } from '../store.js';
import { ROLES } from '../schema.js';
import { isAdmin } from '../perm.js';
import { byId, fmtDateTime, nameOf } from '../lib/data.js';
import { validateUser } from '../lib/validate.js';
import NotFound from './NotFound.jsx';

const SECTIONS = { users: 'Users & Roles', audit: 'Audit Log', settings: 'System Settings' };

export default function Admin() {
  const { section } = useParams();
  const user = getUser(useStore());
  if (!section) return <Navigate to={isAdmin(user) ? '/admin/users' : '/admin/audit'} replace />;
  if (!SECTIONS[section]) return <NotFound />;
  const tabs = Object.entries(SECTIONS).filter(([k]) => k === 'audit' || isAdmin(user)).map(([k, label]) => ({ id: k, label, to: `/admin/${k}` }));
  return (
    <div className="page">
      <PageHeader title="Administration" subtitle="User accounts, the audit trail and system configuration." />
      <div style={{ marginBottom: 16 }}><Tabs items={tabs} active={section} /></div>
      {section === 'users' && <Users />}
      {section === 'audit' && <AuditLog />}
      {section === 'settings' && <Settings />}
    </div>
  );
}

// ─── Users & roles ─────────────────────────────────────────────────────────────
function Users() {
  const state = useStore();
  const { db } = state;
  const me = getUser(state);
  const toast = useToast();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [edit, setEdit] = useState(null);
  const [reset, setReset] = useState(null); // user to reset
  const [temp, setTemp] = useState(null); // { user, password }
  const rows = db.users.filter((u) => (!role || u.role === role) && (!q || `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())));
  const scope = (u) => (u.role === 'coordinator' ? nameOf(db, 'colleges', u.college, 'abbr') : u.personId ? byId([...db.faculty, ...db.students, ...db.employees], u.personId)?.name : '—');

  const toggle = (u) => {
    if (u.id === me.id) { toast('You cannot deactivate your own account.', 'error'); return; }
    saveUser({ ...u, status: u.status === 'active' ? 'inactive' : 'active' });
    toast(`${u.name} ${u.status === 'active' ? 'deactivated' : 'activated'}.`, 'success');
  };
  const exportSpec = () => ({ title: 'User accounts', head: ['Name', 'Email', 'Role', 'Scope', 'Status', 'Last sign-in'], rows: rows.map((u) => [u.name, u.email, ROLES[u.role].label, scope(u), u.status, fmtDateTime(u.lastLogin)]) });

  return (
    <>
      <div className="filter-bar">
        <SearchInput value={q} onChange={setQ} placeholder="Search name or email…" style={{ flex: '1 1 220px', maxWidth: 360 }} aria-label="Search users" />
        <FilterSelect value={role} onChange={setRole} placeholder="All roles" options={Object.entries(ROLES).map(([k, r]) => ({ value: k, label: r.label }))} />
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}><ExportMenu build={exportSpec} /><Btn icon="plus" onClick={() => setEdit({})}>Add user</Btn></span>
      </div>
      <Card pad={false} style={{ overflow: 'hidden' }}>
        {rows.length === 0 ? <EmptyState icon="users" title="No users match" desc="Adjust the search or role filter." /> : (
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Scope</th><th>Status</th><th>Last sign-in</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
            <tbody>{rows.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.name}{u.id === me.id && <span style={{ color: '#5C6B7A', fontWeight: 400 }}> (you)</span>}</td>
                <td style={{ color: '#5C6B7A' }}>{u.email}</td>
                <td><Badge>{ROLES[u.role].short}</Badge></td>
                <td style={{ fontSize: 13 }}>{scope(u)}</td>
                <td><Badge variant={u.status === 'active' ? 'success' : 'muted'}>{u.status === 'active' ? 'Active' : 'Inactive'}</Badge></td>
                <td style={{ fontSize: 13, color: '#5C6B7A', whiteSpace: 'nowrap' }}>{u.lastLogin ? fmtDateTime(u.lastLogin) : 'Never'}</td>
                <td><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <IconBtn icon="edit" label={`Edit ${u.name}`} color="#1F3A93" onClick={() => setEdit(u)} />
                  <IconBtn icon="key" label={`Reset password for ${u.name}`} color="#B7791F" onClick={() => setReset(u)} />
                  <IconBtn icon={u.status === 'active' ? 'lock' : 'check'} label={u.status === 'active' ? `Deactivate ${u.name}` : `Activate ${u.name}`} color="#9B1B1B" onClick={() => toggle(u)} />
                </div></td>
              </tr>))}</tbody></table></div>
        )}
      </Card>
      {edit && <UserModal key={edit.id || 'new'} user={edit} me={me} onClose={() => setEdit(null)} />}
      <ConfirmModal isOpen={!!reset} onClose={() => setReset(null)} title="Reset password" danger={false} confirmLabel="Reset password" message={`Generate a temporary password for ${reset?.name}? Their current password will stop working.`}
        onConfirm={() => setTemp({ user: reset, password: resetPassword(reset.id) })} />
      <Modal isOpen={!!temp} onClose={() => setTemp(null)} title="Temporary password" width={420} footer={<Btn onClick={() => setTemp(null)}>Done</Btn>}>
        <p style={{ fontSize: 14, marginBottom: 12 }}>Give this to <strong>{temp?.user.name}</strong>. It is shown only once.</p>
        <div style={{ fontFamily: 'monospace', fontSize: 20, background: '#F7F8FA', border: '1px dashed #D9DEE4', borderRadius: 6, padding: '12px 16px', textAlign: 'center', userSelect: 'all' }}>{temp?.password}</div>
      </Modal>
    </>
  );
}

function UserModal({ user, me, onClose }) {
  const { db } = useStore();
  const toast = useToast();
  const isNew = !user.id;
  const [form, setForm] = useState({ name: '', email: '', role: 'faculty', college: null, personId: null, status: 'active', ...user, password: isNew ? '' : undefined });
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const peopleKey = ROLES[form.role].people;
  const save = (e) => {
    e?.preventDefault();
    if (user.id === me.id && (form.role !== me.role || form.status !== 'active')) { setErrors({ role: 'You cannot change your own role or deactivate yourself.' }); return; }
    const er = validateUser(form, db);
    setErrors(er);
    if (Object.keys(er).length) { toast('Please fix the highlighted fields.', 'error'); return; }
    const out = { ...form, college: form.role === 'coordinator' ? form.college : null, personId: peopleKey ? form.personId : null };
    if (!out.password) delete out.password;
    const res = saveUser(out);
    if (!res.ok) { setErrors(res.errors); toast(Object.values(res.errors)[0], 'error'); return; }
    toast(`User ${isNew ? 'created' : 'updated'} successfully.`, 'success');
    onClose();
  };
  return (
    <Modal isOpen onClose={onClose} title={isNew ? 'Add user' : 'Edit user'} width={500} footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save}>{isNew ? 'Create user' : 'Save changes'}</Btn></>}>
      <form onSubmit={save} noValidate className="form-stack">
        <FormField label="Full name" required error={errors.name}><Input value={form.name} onChange={(v) => set('name', v)} error={errors.name} /></FormField>
        <FormField label="Email (login)" required error={errors.email}><Input type="email" value={form.email} onChange={(v) => set('email', v)} error={errors.email} placeholder="name@plm.edu.ph" /></FormField>
        <FormField label="Role" required error={errors.role}><Select value={form.role} onChange={(v) => setForm((f) => ({ ...f, role: v, college: null, personId: null }))} error={errors.role} options={Object.entries(ROLES).map(([k, r]) => ({ value: k, label: r.label }))} /></FormField>
        {form.role === 'coordinator' && <FormField label="Assigned college" required error={errors.college}><Select value={form.college || ''} onChange={(v) => set('college', v)} error={errors.college} placeholder="Select college" options={db.colleges.map((c) => ({ value: c.id, label: `${c.abbr} — ${c.name}` }))} /></FormField>}
        {peopleKey && <FormField label={`Linked ${peopleKey === 'faculty' ? 'faculty member' : peopleKey === 'students' ? 'student' : 'employee'}`} required error={errors.personId} hint="Defines which records this user owns.">
          <Select value={form.personId || ''} onChange={(v) => set('personId', v)} error={errors.personId} placeholder="Select person" options={db[peopleKey].map((p) => ({ value: p.id, label: p.name }))} /></FormField>}
        <FormField label={isNew ? 'Password' : 'New password'} required={isNew} error={errors.password} hint={isNew ? 'At least 8 characters, letters and numbers.' : 'Leave blank to keep the current password.'}>
          <Input type="password" value={form.password || ''} onChange={(v) => set('password', v)} error={errors.password} autoComplete="new-password" /></FormField>
        <FormField label="Status"><Select value={form.status} onChange={(v) => set('status', v)} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive (cannot sign in)' }]} /></FormField>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

// ─── Audit log ─────────────────────────────────────────────────────────────────
const ACTION_BADGE = { create: 'success', update: 'default', delete: 'error', login: 'muted', logout: 'muted', export: 'gold', verify: 'success', return: 'warning', 'reset-request': 'warning' };

function AuditLog() {
  const state = useStore();
  const { db } = state;
  const me = getUser(state);
  const [f, setF] = useState({ q: '', user: '', module: '', action: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const set = (k) => (v) => { setF((p) => ({ ...p, [k]: v })); setPage(1); };

  const mine = useMemo(() => db.audit.filter((a) => me.role !== 'coordinator' || a.college === me.college), [db.audit, me]);
  const modules = [...new Set(mine.map((a) => a.module.split(' · ')[0]))].sort();
  const users = [...new Map(mine.filter((a) => a.userId).map((a) => [a.userId, a.userName])).entries()];
  const rows = mine.filter((a) => (!f.user || a.userId === f.user) && (!f.module || a.module.startsWith(f.module)) && (!f.action || a.action === f.action)
    && (!f.from || a.ts.slice(0, 10) >= f.from) && (!f.to || a.ts.slice(0, 10) <= f.to) && (!f.q || `${a.recordTitle} ${a.summary} ${a.recordId}`.toLowerCase().includes(f.q.toLowerCase())));
  const paged = rows.slice((page - 1) * size, page * size);
  const exportSpec = () => ({ title: 'Audit log', filters: [f.from && `from ${f.from}`, f.to && `to ${f.to}`, f.action, f.module].filter(Boolean), head: ['Time', 'User', 'Role', 'Action', 'Module', 'Record', 'Details'],
    rows: rows.map((a) => [fmtDateTime(a.ts), a.userName, a.role ? ROLES[a.role].short : '—', a.action, a.module, a.recordTitle || a.recordId || '', a.summary]) });
  const dirty = Object.values(f).some(Boolean);

  return (
    <>
      <div className="filter-bar">
        <SearchInput value={f.q} onChange={set('q')} placeholder="Search record or details…" style={{ flex: '1 1 200px' }} aria-label="Search audit log" />
        <FilterSelect value={f.user} onChange={set('user')} placeholder="All users" options={users.map(([v, label]) => ({ value: v, label }))} />
        <FilterSelect value={f.module} onChange={set('module')} placeholder="All modules" options={modules} />
        <FilterSelect value={f.action} onChange={set('action')} placeholder="All actions" options={Object.keys(ACTION_BADGE)} />
        <label style={{ fontSize: 13, color: '#5C6B7A', display: 'flex', alignItems: 'center', gap: 6 }}>From <input className="field" type="date" value={f.from} onChange={(e) => set('from')(e.target.value)} aria-label="From date" style={{ padding: '6px 8px', border: '1.5px solid #D9DEE4', borderRadius: 6, fontSize: 13 }} /></label>
        <label style={{ fontSize: 13, color: '#5C6B7A', display: 'flex', alignItems: 'center', gap: 6 }}>To <input className="field" type="date" value={f.to} onChange={(e) => set('to')(e.target.value)} aria-label="To date" style={{ padding: '6px 8px', border: '1.5px solid #D9DEE4', borderRadius: 6, fontSize: 13 }} /></label>
        {dirty && <button type="button" onClick={() => { setF({ q: '', user: '', module: '', action: '', from: '', to: '' }); setPage(1); }} style={{ fontSize: 13, color: '#9B1B1B', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>}
        <span style={{ marginLeft: 'auto' }}><ExportMenu build={exportSpec} /></span>
      </div>
      <Card pad={false} style={{ overflow: 'hidden' }}>
        {rows.length === 0 ? <EmptyState icon="shield" title="No audit entries" desc="No entries match the current filters." /> : (
          <>
            <div className="tbl-wrap"><table className="tbl">
              <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Module</th><th>Record</th><th>Details</th></tr></thead>
              <tbody>{paged.map((a) => (
                <tr key={a.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 13, color: '#5C6B7A' }}>{fmtDateTime(a.ts)}</td>
                  <td><div style={{ fontWeight: 500 }}>{a.userName}</div><div style={{ fontSize: 12, color: '#5C6B7A' }}>{a.role ? ROLES[a.role].short : '—'}</div></td>
                  <td><Badge variant={ACTION_BADGE[a.action] || 'default'}>{a.action}</Badge></td>
                  <td style={{ fontSize: 13 }}>{a.module}</td>
                  <td style={{ maxWidth: 280 }}><div className="clip" style={{ maxWidth: 280 }} title={a.recordTitle}>{a.recordTitle || '—'}</div>{a.recordId && <div style={{ fontSize: 12, color: '#5C6B7A' }}>{a.recordId}</div>}</td>
                  <td style={{ fontSize: 13 }}>{a.summary}</td>
                </tr>))}</tbody></table></div>
            <Pager total={rows.length} page={page} pageSize={size} onPage={setPage} onSize={(n) => { setSize(n); setPage(1); }} />
          </>
        )}
      </Card>
      <p style={{ fontSize: 12.5, color: '#5C6B7A', marginTop: 10 }}>The audit log is read-only: entries are appended automatically and can’t be edited or deleted.{me.role === 'coordinator' && ' You see entries for your college.'}</p>
    </>
  );
}

// ─── Settings ──────────────────────────────────────────────────────────────────
function Settings() {
  const { db } = useStore();
  const toast = useToast();
  const nav = useNavigate();
  const [s, setS] = useState(db.settings);
  const [errors, setErrors] = useState({});
  const [confirm, setConfirm] = useState(false);

  const save = (e) => {
    e.preventDefault();
    const er = {};
    const mins = Number(s.idleMinutes);
    if (!Number.isInteger(mins) || mins < 5 || mins > 240) er.idleMinutes = 'Enter a whole number between 5 and 240.';
    if (!s.activeYear) er.activeYear = 'Select the active academic year.';
    setErrors(er);
    if (Object.keys(er).length) { toast('Please fix the highlighted fields.', 'error'); return; }
    saveSettings({ ...s, idleMinutes: mins });
    toast('System settings saved.', 'success');
  };
  return (
    <div className="grid-bottom" style={{ gridTemplateColumns: 'minmax(0, 560px) 1fr' }}>
      <Card>
        <CardTitle title="General settings" />
        <form onSubmit={save} noValidate className="form-stack">
          <FormField label="Active academic year" required error={errors.activeYear} hint="Default year for new records, the dashboard and reports."><Select value={s.activeYear} onChange={(v) => setS({ ...s, activeYear: v })} error={errors.activeYear} options={db.academicYears.filter((y) => y.active !== false).map((y) => y.label)} /></FormField>
          <FormField label="Default semester" hint="Pre-selected in record forms."><Select value={s.defaultSemester} onChange={(v) => setS({ ...s, defaultSemester: v })} options={db.semesters.filter((x) => x.active !== false).map((x) => ({ value: x.id, label: x.name }))} /></FormField>
          <FormField label="Idle session timeout (minutes)" required error={errors.idleMinutes} hint="Users are signed out after this much inactivity."><Input type="number" value={s.idleMinutes} onChange={(v) => setS({ ...s, idleMinutes: v })} error={errors.idleMinutes} min="5" max="240" /></FormField>
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', fontSize: 14, lineHeight: 1.45 }}>
            <input type="checkbox" checked={s.verifiedOnly} onChange={(e) => setS({ ...s, verifiedOnly: e.target.checked })} style={{ accentColor: '#1F3A93', marginTop: 3 }} />
            <span><strong>Official figures only</strong><br /><span style={{ color: '#5C6B7A' }}>Count only verified records in the dashboard and reports; pending and returned submissions are excluded.</span></span>
          </label>
          <div><Btn type="submit">Save settings</Btn></div>
        </form>
      </Card>
      <Card>
        <CardTitle title="Prototype data" sub="Everything is stored in this browser (localStorage)." />
        <p style={{ fontSize: 14, color: '#5C6B7A', lineHeight: 1.6, marginBottom: 14 }}>{db.records.length} research records · {db.users.length} users · {db.audit.length} audit entries. Resetting restores the original sample data and signs everyone out.</p>
        <Btn variant="danger" icon="undo" onClick={() => setConfirm(true)}>Reset demo data</Btn>
      </Card>
      <ConfirmModal isOpen={confirm} onClose={() => setConfirm(false)} title="Reset demo data" confirmLabel="Reset everything" message="This discards every change made in this browser (records, users, settings, audit log) and restores the sample data."
        onConfirm={() => { resetDemoData(); nav('/login'); }} />
    </div>
  );
}
