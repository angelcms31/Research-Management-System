import { useState } from 'react';
// Read-side helpers: lookups, labels, formatting, scoping, search.
import { TYPES } from '../schema.js';
import { canSee, recordCollege } from '../perm.js';

export const byId = (list, id) => list.find((x) => x.id === id);
export const nameOf = (db, coll, id, field = 'name') => byId(db[coll], id)?.[field] ?? '—';

export const authorList = (db, r) => r.authors.map((id) => byId(db[TYPES[r.type].people], id)).filter(Boolean);
export const authorNames = (db, r) => authorList(db, r).map((p) => p.name).join(', ') || '—';

// Short label for the record's classifying unit: college code, or office name for employee research.
export const unitLabel = (db, r) => (r.office ? nameOf(db, 'offices', r.office) : nameOf(db, 'colleges', r.college, 'abbr'));
export const collegeAbbr = (db, r) => { const c = recordCollege(db, r); return c ? nameOf(db, 'colleges', c, 'abbr') : null; };
export const agencyName = (db, r) => (r.funded ? nameOf(db, 'fundingAgencies', r.fundingAgency) : '—');
export const semesterName = (db, id) => nameOf(db, 'semesters', id);
export const indexOf = (db, id) => byId(db.indexing, id);
export const userName = (db, id) => byId(db.users, id)?.name ?? 'Unknown user';

// Records visible to this user (role scope + review status).
export const visibleRecords = (db, user) => db.records.filter((r) => canSee(db, user, r));

// Common filters: academic year, semester, college. Empty value = no filter.
export const applyFilters = (db, rows, { year, semester, college } = {}) => rows.filter((r) =>
  (!year || r.year === year) && (!semester || r.semester === semester) && (!college || recordCollege(db, r) === college));

// All words must appear somewhere in the searchable text (Documentation §11.1).
export function matchesQuery(db, r, q) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const hay = [r.title, authorNames(db, r), unitLabel(db, r), nameOf(db, 'colleges', recordCollege(db, r) || '', 'name'), r.journal, r.event, r.venue, r.doi, r.issn, TYPES[r.type].label, r.id]
    .join(' ').toLowerCase();
  return terms.every((t) => hay.includes(t));
}

// Dropdown options from a master list; keeps the currently selected value even if since deactivated.
export const options = (list, labelKey = 'name', keep) => list.filter((x) => x.active !== false || x.id === keep).map((x) => ({ value: x.id, label: x[labelKey] }));

// ─── Formatting ────────────────────────────────────────────────────────────────
const D = new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
const DT = new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
export const fmtDate = (v) => (v ? D.format(new Date(v.length === 10 ? `${v}T00:00:00` : v)) : '—');
export const fmtDateTime = (v) => (v ? DT.format(new Date(v)) : '—');

export function timeAgo(iso) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.round(h / 24);
  return d < 31 ? `${d} day${d > 1 ? 's' : ''} ago` : fmtDate(iso);
}

export const pct = (n, total) => (total ? `${Math.round((n / total) * 100)}%` : '0%');

// Where "add" / "edit" live: Published Journals use a full page, the rest a side drawer over the list.
export const newPath = (type) => (TYPES[type].layout === 'page' ? `/records/${type}/new` : `/records/${type}?form=new`);
export const editPath = (r, fromDetail) => (TYPES[r.type].layout === 'page' ? `/records/${r.type}/${r.id}/edit` : `/records/${r.type}?form=edit&id=${r.id}${fromDetail ? '&from=detail' : ''}`);

// sessionStorage-backed state: filters survive navigation within the session (UX recommendation: persistent filter context)
export function useSessionState(key, init) {
  const [v, setV] = useState(() => { try { return { ...init, ...JSON.parse(sessionStorage.getItem(key)) }; } catch { return init; } });
  const set = (patch) => setV((p) => { const n = { ...p, ...patch }; try { sessionStorage.setItem(key, JSON.stringify(n)); } catch { /* ignore */ } return n; });
  return [v, set];
}
