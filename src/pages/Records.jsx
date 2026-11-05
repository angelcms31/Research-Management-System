// Research record list (all five types share this screen) + the full-page add/edit form used by Published Journals.
import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Badge, Btn, ConfirmModal, Drawer, EmptyState, FilterSelect, Icon, IconBtn, IndexBadge, PageHeader, Pager, SearchInput, useToast, Card } from '../components/ui.jsx';
import ExportMenu from '../components/ExportMenu.jsx';
import ReviewActions from '../components/Review.jsx';
import { FormFooter, RecordFields, useRecordForm } from '../components/RecordForm.jsx';
import { deleteRecord, getUser, useStore } from '../store.js';
import { STATUS, TYPES } from '../schema.js';
import { canCreateType, canDelete, canEdit, canReports } from '../perm.js';
import { authorNames, byId, collegeAbbr, editPath, indexOf, matchesQuery, nameOf, newPath, semesterName, unitLabel, useSessionState, visibleRecords } from '../lib/data.js';
import { tableFor } from '../lib/columns.js';
import NotFound from './NotFound.jsx';

const SORTS = {
  title: (db, r) => r.title.toLowerCase(), authors: (db, r) => authorNames(db, r).toLowerCase(), unit: (db, r) => unitLabel(db, r), year: (db, r) => `${r.year}${r.semester}`,
  createdAt: (db, r) => r.createdAt, status: (db, r) => r.status, indexing: (db, r) => indexOf(db, r.indexing)?.name || '', funded: (db, r) => (r.funded ? 1 : 0), n: (db, r) => r.authors.length,
};

export default function RecordsRoute() {
  const { type } = useParams();
  return TYPES[type] ? <RecordList key={type} type={type} /> : <NotFound />;
}

function RecordList({ type }) {
  const t = TYPES[type];
  const state = useStore();
  const { db } = state;
  const user = getUser(state);
  const toast = useToast();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [shared, setShared] = useSessionState('plm-list-filters', { year: '', semester: '' });
  const [q, setQ] = useState('');
  const [f, setF] = useState({ unit: '', indexing: '', funding: '', status: '', mine: false });
  const [sort, setSort] = useState({ key: 'createdAt', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [del, setDel] = useState(null);
  const highlight = params.get('highlight');

  const isOffice = t.unit === 'office';
  const canAdd = canCreateType(user, type);
  const all = useMemo(() => visibleRecords(db, user).filter((r) => r.type === type), [db, user, type]);
  const rows = useMemo(() => {
    let r = all.filter((x) => (!shared.year || x.year === shared.year) && (!shared.semester || x.semester === shared.semester)
      && (!f.unit || (isOffice ? x.office === f.unit : x.college === f.unit)) && (!f.indexing || x.indexing === f.indexing)
      && (!f.funding || (f.funding === 'yes') === !!x.funded) && (!f.status || x.status === f.status)
      && (!f.mine || (user.personId && x.authors.includes(user.personId)) || x.createdBy === user.id) && (!q || matchesQuery(db, x, q)));
    const g = SORTS[sort.key];
    r = [...r].sort((a, b) => { const av = g(db, a); const bv = g(db, b); return (av < bv ? -1 : av > bv ? 1 : 0) * (sort.dir === 'asc' ? 1 : -1); });
    return r;
  }, [all, shared, f, q, sort, db, user, isOffice]);
  const paged = rows.slice((page - 1) * size, page * size);
  const hasFilters = q || shared.year || shared.semester || f.unit || f.indexing || f.funding || f.status || f.mine;
  const clear = () => { setQ(''); setShared({ year: '', semester: '' }); setF({ unit: '', indexing: '', funding: '', status: '', mine: false }); setPage(1); };
  const upd = (patch) => { setF((p) => ({ ...p, ...patch })); setPage(1); };
  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'createdAt' ? 'desc' : 'asc' }));

  // Drawer state lives in the URL so Back / deep links work.
  const formMode = params.get('form');
  const editing = formMode === 'edit' ? all.find((r) => r.id === params.get('id')) : null;
  const drawerOpen = t.layout === 'drawer' && ((formMode === 'new' && canAdd) || (formMode === 'edit' && !!editing && canEdit(db, user, editing)));
  const closeDrawer = () => { const n = new URLSearchParams(params); ['form', 'id', 'from'].forEach((k) => n.delete(k)); setParams(n, { replace: true }); };
  useEffect(() => { // a form link the user may not use (or a record that doesn't exist)
    if (formMode && !drawerOpen && t.layout === 'drawer') { toast(formMode === 'new' ? 'You cannot add this type of record.' : 'That record is not available for editing.', 'error'); closeDrawer(); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { // new-row highlight (brief §9.2): flash, scroll, then clear the param
    if (!highlight) return undefined;
    const row = rows.findIndex((r) => r.id === highlight);
    if (row >= 0) setPage(Math.floor(row / size) + 1);
    const id = setTimeout(() => { const n = new URLSearchParams(params); n.delete('highlight'); setParams(n, { replace: true }); }, 3200);
    return () => clearTimeout(id);
  }, [highlight]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (highlight) document.querySelector('tr.flash')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, [highlight, page]);

  const afterSave = (saved) => {
    if (params.get('from') === 'detail') nav(`/records/${type}/${saved.id}`);
    else { const n = new URLSearchParams(); n.set('highlight', saved.id); setParams(n, { replace: true }); }
  };

  const Th = ({ k, label, cls }) => (
    <th className={`sortable ${cls || ''}`} aria-sort={sort.key === k ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => toggleSort(k)}>{label}<Icon name={sort.dir === 'asc' && sort.key === k ? 'arrow-up' : 'arrow-down'} size={11} color={sort.key === k ? '#1F3A93' : '#D9DEE4'} /></button>
    </th>
  );

  const exportSpec = () => {
    const tb = tableFor(db, type, rows);
    const filters = [shared.year && `AY ${shared.year}`, shared.semester && semesterName(db, shared.semester), f.unit && (isOffice ? nameOf(db, 'offices', f.unit) : nameOf(db, 'colleges', f.unit, 'abbr')), q && `Search: “${q}”`].filter(Boolean);
    return { title: t.label, filters, ...tb };
  };

  return (
    <div className="page">
      <PageHeader title={t.label} subtitle={`${all.length} record${all.length === 1 ? '' : 's'} you can access${user.role === 'auditor' ? ' · read-only access' : ''}`}
        actions={<>{canReports(user) && <ExportMenu build={exportSpec} />}{canAdd && <Btn icon="plus" to={newPath(type)}>Add {t.singular}</Btn>}</>} />

      <div className="filter-bar" role="search" aria-label={`Filter ${t.label}`}>
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search title, author, keyword…" style={{ flex: '1 1 200px', minWidth: 180 }} aria-label="Search records" />
        {user.role !== 'coordinator' && (isOffice
          ? <FilterSelect value={f.unit} onChange={(v) => upd({ unit: v })} placeholder="All offices" options={db.offices.map((o) => ({ value: o.id, label: o.name }))} />
          : <FilterSelect value={f.unit} onChange={(v) => upd({ unit: v })} placeholder="All colleges" options={db.colleges.map((c) => ({ value: c.id, label: `${c.abbr} — ${c.name}` }))} />)}
        <FilterSelect value={shared.semester} onChange={(v) => { setShared({ semester: v }); setPage(1); }} placeholder="All semesters" options={db.semesters.map((s) => ({ value: s.id, label: s.name }))} />
        <FilterSelect value={shared.year} onChange={(v) => { setShared({ year: v }); setPage(1); }} placeholder="All years" options={db.academicYears.map((y) => y.label)} />
        {t.journal && <FilterSelect value={f.indexing} onChange={(v) => upd({ indexing: v })} placeholder="All indexing" options={db.indexing.map((i) => ({ value: i.id, label: i.name }))} />}
        {t.funding && <FilterSelect value={f.funding} onChange={(v) => upd({ funding: v })} placeholder="Any funding" options={[{ value: 'yes', label: 'Funded' }, { value: 'no', label: 'Unfunded' }]} />}
        {user.role !== 'auditor' && <FilterSelect value={f.status} onChange={(v) => upd({ status: v })} placeholder="All statuses" options={Object.entries(STATUS).map(([k, s]) => ({ value: k, label: s.label }))} />}
        {user.role === 'faculty' && <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}><input type="checkbox" checked={f.mine} onChange={(e) => upd({ mine: e.target.checked })} style={{ accentColor: '#1F3A93' }} />My records only</label>}
        {hasFilters && <button type="button" onClick={clear} style={{ fontSize: 13, color: '#9B1B1B', background: 'none', border: 'none', cursor: 'pointer', padding: '7px 8px', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="x" size={12} color="#9B1B1B" /> Clear filters</button>}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#5C6B7A' }}>{rows.length} result{rows.length === 1 ? '' : 's'}</span>
      </div>

      <Card pad={false} style={{ overflow: 'hidden' }}>
        {rows.length === 0 ? (
          <EmptyState icon={t.icon} title={hasFilters ? `No ${t.label.toLowerCase()} match your filters` : `No ${t.label.toLowerCase()} yet`}
            desc={hasFilters ? 'Try adjusting or clearing the filters.' : canAdd ? 'Add the first record to get started.' : 'Nothing has been recorded here yet.'}
            action={hasFilters ? <Btn variant="secondary" onClick={clear}>Clear filters</Btn> : canAdd && <Btn icon="plus" to={newPath(type)}>Add {t.singular}</Btn>} />
        ) : (
          <>
            <div className="tbl-wrap">
              <table className="tbl">
                <caption style={{ position: 'absolute', left: -9999 }}>{t.label} records</caption>
                <thead>
                  <tr>
                    <Th k="title" label="Title" />
                    <Th k="authors" label={t.people === 'students' ? 'Students' : t.people === 'employees' ? 'Employees' : 'Authors'} />
                    <Th k="unit" label={isOffice ? 'Office' : 'College'} />
                    {t.journal && <><Th k="indexing" label="Indexing" /><th>DOI</th></>}
                    {t.funding && <Th k="funded" label="Funding" />}
                    {t.course && <><th>Course</th><Th k="n" label="# Students" cls="num" /></>}
                    <Th k="year" label="Year / Semester" />
                    <Th k="status" label="Status" />
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((r) => (
                    <tr key={r.id} className={r.id === highlight ? 'flash' : ''}>
                      <td style={{ maxWidth: 340 }}>
                        <Link to={`/records/${type}/${r.id}`} style={{ fontWeight: 500, color: '#1F2933', textDecoration: 'none', display: 'block' }} className="clip">{r.title}</Link>
                        {t.journal && <div style={{ fontSize: 12, color: '#5C6B7A', marginTop: 2 }} className="clip">{r.journal}</div>}
                        {t.event && <div style={{ fontSize: 12, color: '#5C6B7A', marginTop: 2 }} className="clip">{r.event}</div>}
                      </td>
                      <td style={{ color: '#5C6B7A', fontSize: 13 }}><span className="clip" style={{ display: 'block', maxWidth: 200 }} title={authorNames(db, r)}>{authorNames(db, r)}</span></td>
                      <td><Badge>{unitLabel(db, r)}</Badge></td>
                      {t.journal && <><td><IndexBadge idx={indexOf(db, r.indexing)} /></td><td>{r.doi ? <a href={`https://doi.org/${r.doi}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>{r.doi}</a> : '—'}</td></>}
                      {t.funding && <td><Badge variant={r.funded ? 'funded' : 'unfunded'}>{r.funded ? 'Funded' : 'Unfunded'}</Badge></td>}
                      {t.course && <><td style={{ fontSize: 13, color: '#5C6B7A' }}>{nameOf(db, 'courses', r.course, 'code')}</td><td className="num" style={{ color: '#5C6B7A' }}>{r.authors.length}</td></>}
                      <td style={{ fontSize: 13, color: '#5C6B7A', whiteSpace: 'nowrap' }}>{r.year}<br /><span style={{ fontSize: 12 }}>{semesterName(db, r.semester)}</span></td>
                      <td><Badge variant={STATUS[r.status].variant}>{STATUS[r.status].label}</Badge></td>
                      <td>
                        <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                          <ReviewActions rec={r} compact />
                          <IconBtn icon="eye" label={`View ${r.id}`} to={`/records/${type}/${r.id}`} />
                          {canEdit(db, user, r) && <IconBtn icon="edit" label={`Edit ${r.id}`} color="#1F3A93" to={editPath(r)} />}
                          {canDelete(db, user, r) && <IconBtn icon="trash" label={`Delete ${r.id}`} color="#9B1B1B" onClick={() => setDel(r)} />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager total={rows.length} page={page} pageSize={size} onPage={setPage} onSize={(n) => { setSize(n); setPage(1); }} />
          </>
        )}
      </Card>

      <Drawer isOpen={drawerOpen} onClose={closeDrawer} title={editing ? `Edit ${t.singular}` : `Add ${t.singular}`} width={520}>
        {drawerOpen && <DrawerForm key={editing?.id || 'new'} type={type} record={editing} onClose={closeDrawer} onSaved={afterSave} />}
      </Drawer>

      <ConfirmModal isOpen={!!del} onClose={() => setDel(null)} title="Delete record"
        message={`Delete “${del?.title}”? This cannot be undone, and the deletion will be recorded in the audit log.`}
        onConfirm={() => { deleteRecord(del.id); toast('Record deleted.', 'success'); }} />
    </div>
  );
}

// Drawer body: sticky footer with Cancel / Save (Enter in a single-line field also saves).
function DrawerForm({ type, record, onClose, onSaved }) {
  const ctl = useRecordForm(type, record, onSaved);
  return (
    <form onSubmit={(e) => { e.preventDefault(); ctl.submit(); }} noValidate style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <RecordFields type={type} ctl={ctl} />
      {record && <AuditHint db={ctl.db} rec={record} />}
      <div style={{ position: 'sticky', bottom: -24, margin: '24px -24px -24px', padding: '14px 24px', borderTop: '1px solid #D9DEE4', display: 'flex', gap: 8, justifyContent: 'flex-end', background: '#fff' }}>
        <FormFooter onCancel={onClose} onSave={ctl.submit} editing={!!record} />
      </div>
    </form>
  );
}

const AuditHint = ({ db, rec }) => (
  <div style={{ background: '#F7F8FA', border: '1px solid #D9DEE4', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#5C6B7A', lineHeight: 1.7, marginTop: 18 }}>
    Created by <strong>{byId(db.users, rec.createdBy)?.name || '—'}</strong> · Last edited by <strong>{byId(db.users, rec.updatedBy)?.name || '—'}</strong>
  </div>
);

// ─── Full-page form (Published Journals): section nav on the left, sticky footer ───
export function RecordFormPage() {
  const { type, id } = useParams();
  const state = useStore();
  const user = getUser(state);
  const nav = useNavigate();
  const t = TYPES[type];
  const rec = id ? state.db.records.find((r) => r.id === id) : null;
  if (!t) return <NotFound />;
  if (t.layout !== 'page') return <Navigate to={id ? editPath({ type, id }) : newPath(type)} replace />;
  if (id && !rec) return <NotFound />;
  const allowed = id ? canEdit(state.db, user, rec) : canCreateType(user, type);
  if (!allowed) return <Navigate to={`/records/${type}`} replace />;
  return <PageForm key={id || 'new'} type={type} record={rec} onCancel={() => nav(id ? `/records/${type}/${id}` : `/records/${type}`)}
    onSaved={(s) => nav(id ? `/records/${type}/${s.id}` : `/records/${type}?highlight=${s.id}`)} />;
}

function PageForm({ type, record, onCancel, onSaved }) {
  const t = TYPES[type];
  const ctl = useRecordForm(type, record, onSaved);
  const sections = ['1 · Article', '2 · Journal', '3 · Indexing', '4 · Context'];
  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <PageHeader title={record ? `Edit ${t.singular}` : `Add ${t.singular}`} subtitle={record ? record.id : 'Fill in the sections below. Fields marked * are required.'} back={{ to: record ? `/records/${type}/${record.id}` : `/records/${type}`, label: record ? 'Back to record' : `Back to ${t.label}` }} />
      <form onSubmit={(e) => { e.preventDefault(); ctl.submit(); }} noValidate>
        <div className="page-form">
          <nav className="hide-sm" aria-label="Form sections" style={{ position: 'sticky', top: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sections.map((s) => <a key={s} href={`#sec-${s.slice(0, 1)}`} onClick={(e) => { e.preventDefault(); document.getElementById(`sec-${s.slice(0, 1)}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} style={{ padding: '8px 12px', borderRadius: 6, fontSize: 14, color: '#1F3A93', textDecoration: 'none', fontWeight: 500 }}>{s}</a>)}
          </nav>
          <div>
            <RecordFields type={type} ctl={ctl} sectioned />
            {record && <AuditHint db={ctl.db} rec={record} />}
          </div>
        </div>
        <div style={{ position: 'sticky', bottom: 0, margin: '24px -28px -48px', padding: '14px 28px', borderTop: '1px solid #D9DEE4', background: '#fff', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <FormFooter onCancel={onCancel} onSave={ctl.submit} editing={!!record} />
        </div>
      </form>
    </div>
  );
}
