// Role → capability rules (see Documentation §4 permissions matrix) and record scoping.
import { TYPES, TYPE_LIST } from './schema.js';

const isApprover = (u) => u.role === 'admin' || u.role === 'coordinator';

// Which college a record belongs to (employee research resolves through the office).
export const recordCollege = (db, r) => r.college || db.offices.find((o) => o.id === r.office)?.college || null;

// Record types a user may create/edit (contributors only their own kind of output).
export function canCreateType(u, type) {
  const t = TYPES[type];
  if (u.role === 'admin' || u.role === 'coordinator') return true;
  if (u.role === 'faculty') return t.people === 'faculty';
  if (u.role === 'student') return t.people === 'students';
  if (u.role === 'employee') return t.people === 'employees';
  return false;
}

// Is the user an author/owner of the record?
export const isOwner = (u, r) => !!u.personId && (r.authors.includes(u.personId) || r.createdBy === u.id);

const inScope = (db, u, r) => u.role !== 'coordinator' || recordCollege(db, r) === u.college;

// Records the user is allowed to see at all (repository, lists, reports, dashboard).
export function canSee(db, u, r) {
  if (r.status !== 'verified' && !(isApprover(u) && inScope(db, u, r)) && !isOwner(u, r)) return false;
  switch (u.role) {
    case 'admin': case 'auditor': case 'faculty': return true;
    case 'coordinator': return inScope(db, u, r);
    default: return isOwner(u, r); // student / employee: own records only
  }
}

export const canEdit = (db, u, r) => canCreateType(u, r.type) && (u.role === 'admin' || (u.role === 'coordinator' ? inScope(db, u, r) : isOwner(u, r)));
export const canDelete = (db, u, r) => (u.role === 'admin' || (u.role === 'coordinator' && inScope(db, u, r)));
export const canApprove = (db, u, r) => isApprover(u) && inScope(db, u, r) && r.status === 'pending';

export const canReports = (u) => ['admin', 'coordinator', 'faculty', 'auditor'].includes(u.role);
export const canAudit = (u) => ['admin', 'coordinator', 'auditor'].includes(u.role);
export const isAdmin = (u) => u.role === 'admin';

// Record types that appear in this user's navigation.
export const visibleTypes = (u) => TYPE_LIST.filter((t) => (['student', 'employee'].includes(u.role) ? canCreateType(u, t.id) : true));

// Can this user reach the screen at `path` (first segment matters)?
export function canRoute(u, path) {
  const [, seg, sub] = path.split('/');
  switch (seg) {
    case 'reports': return canReports(u);
    case 'maintenance': return isAdmin(u);
    case 'admin': return sub === 'audit' ? canAudit(u) : isAdmin(u);
    case 'records': return !TYPES[sub] || visibleTypes(u).some((t) => t.id === sub); // detail pages are filtered by canSee
    default: return true;
  }
}

// Apply the active setting "official figures only" (dashboard & reports).
export const officialOnly = (db, rows) => (db.settings.verifiedOnly ? rows.filter((r) => r.status === 'verified') : rows);
