// Tiny external store backed by localStorage (no backend). Every write goes through the functions here,
// and every write that matters is recorded in the audit log from this one place.
import { useSyncExternalStore } from 'react';
import { MASTERS, TYPES } from './schema.js';
import { makeSeed, SEED_VERSION } from './seed.js';

const DB_KEY = 'plm-rms-db';
const SESSION_KEY = 'plm-rms-session';

const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full/blocked: keep in memory */ } };

function loadDb() {
  const saved = read(DB_KEY);
  if (saved && saved.version === SEED_VERSION) return saved; // version bump discards stale demo data
  const fresh = makeSeed();
  write(DB_KEY, fresh);
  return fresh;
}

let state = { db: loadDb(), session: read(SESSION_KEY) };
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };

export const useStore = () => useSyncExternalStore(subscribe, () => state);
export const getState = () => state;

const setDb = (db) => { state = { ...state, db }; write(DB_KEY, db); emit(); };
const setSession = (session) => { state = { ...state, session }; if (session) write(SESSION_KEY, session); else localStorage.removeItem(SESSION_KEY); emit(); };

export const getUser = (s = state) => s.db.users.find((u) => u.id === s.session?.userId && u.status === 'active') || null;
export const newId = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

// Append an audit entry (newest first, capped). `db` is the db being written.
function withAudit(db, user, e) {
  const entry = {
    id: newId('a'), ts: new Date().toISOString(), userId: user?.id || null, userName: user?.name || e.userName || 'Anonymous',
    role: user?.role || null, college: null, recordId: null, recordTitle: '', ...e,
  };
  return { ...db, audit: [entry, ...db.audit].slice(0, 2000) };
}
const collegeOfRecord = (db, r) => r.college || db.offices.find((o) => o.id === r.office)?.college || null;

// ─── Session ───────────────────────────────────────────────────────────────────
export function login(email, password) {
  const { db } = state;
  const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
  if (!u || u.password !== password) return { ok: false, error: 'Incorrect email or password.' };
  if (u.status !== 'active') return { ok: false, error: 'This account has been deactivated. Please contact the Research Office.' };
  const now = new Date().toISOString();
  const users = db.users.map((x) => (x.id === u.id ? { ...x, lastLogin: now } : x));
  setDb(withAudit({ ...db, users }, u, { action: 'login', module: 'Authentication', summary: 'Signed in', college: u.college }));
  setSession({ userId: u.id, lastActive: Date.now() });
  return { ok: true, user: u };
}

export function logout(reason) {
  const u = getUser();
  if (u) setDb(withAudit(state.db, u, { action: 'logout', module: 'Authentication', summary: reason || 'Signed out', college: u.college }));
  setSession(null);
}

// Idle tracking is deliberately not a store update (would re-render on every mouse move).
export const touch = () => { if (state.session) { state.session.lastActive = Date.now(); write(SESSION_KEY, state.session); } };

export function requestPasswordReset(email) {
  const u = state.db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
  if (u) setDb(withAudit(state.db, null, { userName: u.name, action: 'reset-request', module: 'Authentication', summary: `Password reset requested for ${u.email}` }));
  return !!u;
}

// ─── Research records ──────────────────────────────────────────────────────────
const DIFF_FIELDS = { title: 'title', authors: 'authors', college: 'college', office: 'office', course: 'course', year: 'academic year', semester: 'semester',
  funded: 'funding', fundingAgency: 'funding agency', event: 'event', venue: 'venue', eventDate: 'event date', journal: 'journal', issn: 'ISSN',
  volume: 'volume', yearPublished: 'year published', doi: 'DOI', indexing: 'indexing' };

export function saveRecord(rec) {
  const user = getUser();
  const { db } = state;
  const existing = db.records.find((r) => r.id === rec.id);
  const now = new Date().toISOString();
  let saved; let records; let summary;
  if (existing) {
    const changed = Object.keys(DIFF_FIELDS).filter((k) => JSON.stringify(existing[k] ?? null) !== JSON.stringify(rec[k] ?? null)).map((k) => DIFF_FIELDS[k]);
    // Contributors' edits go back to review (also resubmits a returned record); approvers' edits keep the status.
    const approver = user.role === 'admin' || user.role === 'coordinator';
    const status = approver ? existing.status : 'pending';
    saved = { ...existing, ...rec, status, returnReason: status === 'returned' ? existing.returnReason : '', updatedAt: now, updatedBy: user.id };
    records = db.records.map((r) => (r.id === saved.id ? saved : r));
    summary = changed.length ? `Updated: ${changed.join(', ')}` : 'Saved with no changes';
    if (!approver && existing.status !== 'pending') summary += ' (resubmitted for review)';
  } else {
    const t = TYPES[rec.type];
    const n = db.records.filter((r) => r.type === rec.type).reduce((m, r) => Math.max(m, parseInt(r.id.split('-')[1], 10) || 0), 0) + 1;
    const approver = user.role === 'admin' || user.role === 'coordinator';
    saved = { ...rec, id: `${t.prefix}-${String(n).padStart(4, '0')}`, status: approver ? 'verified' : 'pending', returnReason: '',
      createdAt: now, createdBy: user.id, updatedAt: now, updatedBy: user.id };
    records = [saved, ...db.records];
    summary = approver ? 'Record created' : 'Record submitted for review';
  }
  setDb(withAudit({ ...db, records }, user, { action: existing ? 'update' : 'create', module: TYPES[saved.type].label, recordId: saved.id,
    recordTitle: saved.title, summary, college: collegeOfRecord(db, saved) }));
  return saved;
}

export function deleteRecord(id) {
  const user = getUser();
  const { db } = state;
  const r = db.records.find((x) => x.id === id);
  if (!r) return;
  setDb(withAudit({ ...db, records: db.records.filter((x) => x.id !== id) }, user, { action: 'delete', module: TYPES[r.type].label,
    recordId: r.id, recordTitle: r.title, summary: 'Record deleted', college: collegeOfRecord(db, r) }));
}

export function setRecordStatus(id, status, reason = '') {
  const user = getUser();
  const { db } = state;
  const r = db.records.find((x) => x.id === id);
  if (!r) return;
  const now = new Date().toISOString();
  const records = db.records.map((x) => (x.id === id ? { ...x, status, returnReason: status === 'returned' ? reason : '', updatedAt: now, updatedBy: user.id } : x));
  setDb(withAudit({ ...db, records }, user, { action: status === 'verified' ? 'verify' : 'return', module: TYPES[r.type].label, recordId: r.id,
    recordTitle: r.title, summary: status === 'verified' ? 'Record verified' : `Returned to author: ${reason}`, college: collegeOfRecord(db, r) }));
}

// ─── Master data ───────────────────────────────────────────────────────────────
// How many other rows reference this master entry (drives the "in use" delete block).
export function usageCount(db, entity, id) {
  return MASTERS[entity].refs.reduce((n, [coll, field, isArray]) => n + (db[coll] || []).filter((row) => (isArray ? (row[field] || []).includes(id) : row[field] === id)).length, 0);
}

export function saveMaster(entity, item) {
  const user = getUser();
  const { db } = state;
  const cfg = MASTERS[entity];
  const label = (it) => it[cfg.fields[0].key];
  const isNew = !item.id;
  const next = { ...item };
  if (isNew) next.id = entity === 'academicYears' ? item.label : newId(entity.slice(0, 3));
  if (isNew && db[entity].some((x) => x.id === next.id)) return { ok: false, errors: { [cfg.fields[0].key]: `${cfg.singular} already exists.` } };
  const list = isNew ? [next, ...db[entity]] : db[entity].map((x) => (x.id === next.id ? next : x));
  setDb(withAudit({ ...db, [entity]: list }, user, { action: isNew ? 'create' : 'update', module: `Maintenance · ${cfg.title}`, recordId: next.id, recordTitle: label(next), summary: isNew ? `${cfg.singular} added` : `${cfg.singular} updated` }));
  return { ok: true, item: next };
}

export function deleteMaster(entity, id) {
  const user = getUser();
  const { db } = state;
  const cfg = MASTERS[entity];
  const item = db[entity].find((x) => x.id === id);
  const used = usageCount(db, entity, id);
  if (used) return { ok: false, error: `“${item[cfg.fields[0].key]}” is used by ${used} other record${used > 1 ? 's' : ''} and cannot be deleted. Deactivate it instead.` };
  setDb(withAudit({ ...db, [entity]: db[entity].filter((x) => x.id !== id) }, user, { action: 'delete', module: `Maintenance · ${cfg.title}`, recordId: id, recordTitle: item[cfg.fields[0].key], summary: `${cfg.singular} deleted` }));
  return { ok: true };
}

// ─── Users & settings ──────────────────────────────────────────────────────────
export function saveUser(u) {
  const actor = getUser();
  const { db } = state;
  const email = u.email.trim().toLowerCase();
  if (db.users.some((x) => x.email.toLowerCase() === email && x.id !== u.id)) return { ok: false, errors: { email: 'This email is already used by another account.' } };
  const isNew = !u.id;
  const next = { ...u, email, id: u.id || newId('u') };
  const old = db.users.find((x) => x.id === next.id);
  const users = isNew ? [...db.users, { lastLogin: null, ...next }] : db.users.map((x) => (x.id === next.id ? { ...x, ...next } : x));
  let summary = isNew ? `Account created (${next.role})` : 'Account updated';
  if (old && old.role !== next.role) summary = `Role changed: ${old.role} → ${next.role}`;
  if (old && old.status !== next.status) summary = next.status === 'active' ? 'Account activated' : 'Account deactivated';
  setDb(withAudit({ ...db, users }, actor, { action: isNew ? 'create' : 'update', module: 'User Management', recordId: next.id, recordTitle: next.name, summary }));
  return { ok: true };
}

export function resetPassword(userId) {
  const actor = getUser();
  const { db } = state;
  const u = db.users.find((x) => x.id === userId);
  const temp = `Plm@${Math.floor(1000 + Math.random() * 9000)}`;
  setDb(withAudit({ ...db, users: db.users.map((x) => (x.id === userId ? { ...x, password: temp } : x)) }, actor, { action: 'update', module: 'User Management', recordId: userId, recordTitle: u.name, summary: 'Password reset by administrator' }));
  return temp;
}

export function saveSettings(settings) {
  setDb(withAudit({ ...state.db, settings }, getUser(), { action: 'update', module: 'System Settings', summary: 'System settings updated' }));
}

export function logExport(title, format, count) {
  setDb(withAudit(state.db, getUser(), { action: 'export', module: 'Export', recordTitle: title, summary: `Exported ${count} row${count === 1 ? '' : 's'} to ${format}`, college: getUser()?.college || null }));
}

export function resetDemoData() {
  const fresh = makeSeed();
  write(DB_KEY, fresh);
  localStorage.removeItem(SESSION_KEY);
  state = { db: fresh, session: null };
  emit();
}
