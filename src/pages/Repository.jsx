// Repository Search (wireframe 7A): keyword + facets on the left, results grouped by record type.
// All state is in the URL (?q=…&type=…) so the top-bar search, Back button and shared links just work.
import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge, Btn, Card, EmptyState, FormField, Icon, IndexBadge, PageHeader, Select } from '../components/ui.jsx';
import ExportMenu from '../components/ExportMenu.jsx';
import { getUser, useStore } from '../store.js';
import { STATUS, TYPE_LIST, TYPES } from '../schema.js';
import { canReports, recordCollege } from '../perm.js';
import { authorNames, byId, indexOf, matchesQuery, nameOf, semesterName, unitLabel, visibleRecords } from '../lib/data.js';
import { tableFor } from '../lib/columns.js';

const SORTS = { relevance: 'Most relevant', newest: 'Newest first', oldest: 'Oldest first', title: 'Title A–Z' };
const FACETS = ['type', 'college', 'year', 'semester', 'author', 'index'];
const PREVIEW = 5;

export default function Repository() {
  const state = useStore();
  const { db } = state;
  const user = getUser(state);
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState(params.get('q') || '');
  const [open, setOpen] = useState({});
  const q = params.get('q') || '';
  const f = Object.fromEntries(FACETS.map((k) => [k, params.get(k) || '']));
  const sort = params.get('sort') || 'relevance';
  const active = !!q || FACETS.some((k) => f[k]);

  // keep the input in sync when the top-bar search changes ?q
  React.useEffect(() => { setDraft(q); }, [q]);
  const setP = (patch) => { const n = new URLSearchParams(params); Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k))); setParams(n); setOpen({}); };

  const all = useMemo(() => visibleRecords(db, user), [db, user]);
  const authorsInScope = useMemo(() => {
    const ids = new Set(all.flatMap((r) => r.authors));
    return [...db.faculty, ...db.students, ...db.employees].filter((p) => ids.has(p.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [all, db]);

  const results = useMemo(() => {
    if (!active) return [];
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const score = (r) => terms.reduce((s, t) => s + (r.title.toLowerCase().includes(t) ? 3 : 0) + (authorNames(db, r).toLowerCase().includes(t) ? 2 : 0) + 1, 0);
    const rs = all.filter((r) => matchesQuery(db, r, q) && (!f.type || r.type === f.type) && (!f.college || recordCollege(db, r) === f.college) && (!f.year || r.year === f.year)
      && (!f.semester || r.semester === f.semester) && (!f.author || r.authors.includes(f.author)) && (!f.index || r.indexing === f.index));
    return rs.map((r) => ({ r, s: score(r) })).sort((a, b) => (sort === 'title' ? a.r.title.localeCompare(b.r.title) : sort === 'oldest' ? a.r.createdAt.localeCompare(b.r.createdAt)
      : sort === 'newest' ? b.r.createdAt.localeCompare(a.r.createdAt) : b.s - a.s || b.r.createdAt.localeCompare(a.r.createdAt))).map((x) => x.r);
  }, [all, db, q, f.type, f.college, f.year, f.semester, f.author, f.index, sort, active]); // eslint-disable-line react-hooks/exhaustive-deps

  const groups = TYPE_LIST.map((t) => ({ t, rows: results.filter((r) => r.type === t.id) })).filter((g) => g.rows.length);
  const submit = (e) => { e.preventDefault(); setP({ q: draft.trim() }); };
  const clear = () => { setDraft(''); setParams({}); setOpen({}); };
  const exportSpec = () => ({ title: `Repository search${q ? `: ${q}` : ''}`, filters: [q && `Keyword “${q}”`, f.type && TYPES[f.type].label, f.college && nameOf(db, 'colleges', f.college, 'abbr'), f.year && `AY ${f.year}`].filter(Boolean), ...tableFor(db, 'all', results) });

  // Browse mode (no keyword, no filter): counts by type / college / year / index that open a filtered listing
  const browse = useMemo(() => ({
    Type: TYPE_LIST.map((t) => ({ k: 'type', v: t.id, label: t.label, n: all.filter((r) => r.type === t.id).length })),
    College: db.colleges.map((c) => ({ k: 'college', v: c.id, label: c.abbr, n: all.filter((r) => recordCollege(db, r) === c.id).length })),
    'Academic year': db.academicYears.map((y) => ({ k: 'year', v: y.label, label: y.label, n: all.filter((r) => r.year === y.label).length })),
    Indexing: db.indexing.map((i) => ({ k: 'index', v: i.id, label: i.name, n: all.filter((r) => r.indexing === i.id).length })),
  }), [all, db]);

  return (
    <div className="page">
      <PageHeader title="Repository Search" subtitle="Search across every research record — faculty, employee, presented papers, published journals and student research."
        actions={canReports(user) && active && results.length > 0 && <ExportMenu build={exportSpec} />} />

      <form onSubmit={submit} role="search" style={{ background: '#fff', border: '1px solid #D9DEE4', borderRadius: 8, padding: '18px 20px', marginBottom: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Icon name="search" size={18} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input className="field" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Search the repository" placeholder="Search by title, author, college, journal, event or keyword…"
            style={{ width: '100%', padding: '11px 14px 11px 42px', border: '1.5px solid #D9DEE4', borderRadius: 6, fontSize: 15 }} />
        </div>
        <Btn type="submit" size="lg">Search</Btn>
      </form>

      <div className="repo-layout">
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#5C6B7A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Refine</span>
            {active && <button type="button" onClick={clear} style={{ background: 'none', border: 'none', color: '#9B1B1B', fontSize: 13, cursor: 'pointer' }}>Clear all</button>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FormField label="Record type"><Select value={f.type} onChange={(v) => setP({ type: v })} placeholder="All types" options={TYPE_LIST.map((t) => ({ value: t.id, label: t.label }))} /></FormField>
            {user.role !== 'coordinator' && <FormField label="College"><Select value={f.college} onChange={(v) => setP({ college: v })} placeholder="All colleges" options={db.colleges.map((c) => ({ value: c.id, label: c.abbr }))} /></FormField>}
            <FormField label="Academic year"><Select value={f.year} onChange={(v) => setP({ year: v })} placeholder="All years" options={db.academicYears.map((y) => y.label)} /></FormField>
            <FormField label="Semester"><Select value={f.semester} onChange={(v) => setP({ semester: v })} placeholder="All semesters" options={db.semesters.map((s) => ({ value: s.id, label: s.name }))} /></FormField>
            <FormField label="Author"><Select value={f.author} onChange={(v) => setP({ author: v })} placeholder="Any author" options={authorsInScope.map((p) => ({ value: p.id, label: p.name }))} /></FormField>
            <FormField label="Index (journals)"><Select value={f.index} onChange={(v) => setP({ index: v })} placeholder="Any index" options={db.indexing.map((i) => ({ value: i.id, label: i.name }))} /></FormField>
            <FormField label="Sort by"><Select value={sort} onChange={(v) => setP({ sort: v === 'relevance' ? '' : v })} options={Object.entries(SORTS).map(([value, label]) => ({ value, label }))} /></FormField>
          </div>
        </Card>

        <div style={{ minWidth: 0 }}>
          {!active && (
            <Card>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Browse the repository</div>
              <p style={{ fontSize: 13.5, color: '#5C6B7A', marginBottom: 14 }}>Type a keyword above, or open a listing by one of these dimensions.</p>
              {Object.entries(browse).map(([title, items]) => (
                <div key={title} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1F3A93', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{title}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {items.filter((i) => i.n).map((i) => (
                      <button type="button" key={i.v} className="btn" onClick={() => setP({ [i.k]: i.v })} style={{ display: 'inline-flex', gap: 8, alignItems: 'center', background: '#F7F8FA', border: '1.5px solid #D9DEE4', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13.5 }}>
                        {i.label}<span style={{ background: '#E9EDF7', color: '#1F3A93', borderRadius: 10, padding: '0 8px', fontSize: 12, fontWeight: 600 }}>{i.n}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </Card>
          )}

          {active && (
            <>
              <div role="status" style={{ fontSize: 13.5, color: '#5C6B7A', marginBottom: 12 }}><strong style={{ color: '#1F2933' }}>{results.length}</strong> result{results.length === 1 ? '' : 's'}{q && <> for “<strong style={{ color: '#1F2933' }}>{q}</strong>”</>}</div>
              {results.length === 0 && <Card pad={false}><EmptyState icon="search" title="No results found" desc="Try a different keyword, fewer words, or remove some filters." action={<Btn variant="secondary" onClick={clear}>Clear search</Btn>} /></Card>}
              {groups.map(({ t, rows }) => {
                const shown = open[t.id] ? rows : rows.slice(0, PREVIEW);
                return (
                  <section key={t.id} style={{ marginBottom: 18 }} aria-label={t.label}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Icon name={t.icon} size={15} color="#1F3A93" />
                      <h2 style={{ fontSize: 13, fontWeight: 700, color: '#1F3A93', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{t.label}</h2>
                      <span style={{ fontSize: 12, color: '#5C6B7A', background: '#E9EDF7', borderRadius: 10, padding: '1px 8px' }}>{rows.length}</span>
                    </div>
                    <Card pad={false} style={{ overflow: 'hidden' }}>
                      {shown.map((r, i) => (
                        <div key={r.id} style={{ padding: '14px 18px', borderBottom: i < shown.length - 1 || rows.length > PREVIEW ? '1px solid #F0F2F4' : 'none', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#E9EDF7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={t.icon} size={17} color="#1F3A93" /></div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Link to={`/records/${r.type}/${r.id}`} style={{ fontSize: 14.5, fontWeight: 600, color: '#1F2933', textDecoration: 'none', lineHeight: 1.4, display: 'block', marginBottom: 4 }}>{r.title}</Link>
                            <div style={{ display: 'flex', gap: '4px 10px', flexWrap: 'wrap', alignItems: 'center', fontSize: 12.5, color: '#5C6B7A' }}>
                              <span>{authorNames(db, r)}</span><Badge>{unitLabel(db, r)}</Badge><span>{r.year} · {semesterName(db, r.semester)}</span>
                              {r.indexing && <IndexBadge idx={indexOf(db, r.indexing)} />}
                              {r.journal && <em>{r.journal}</em>}{r.event && <span>{r.event}</span>}
                              {r.status !== 'verified' && <Badge variant={STATUS[r.status].variant}>{STATUS[r.status].label}</Badge>}
                            </div>
                          </div>
                          <Btn variant="link" size="sm" icon="eye" to={`/records/${r.type}/${r.id}`} aria-label={`View ${r.title}`}>View</Btn>
                        </div>
                      ))}
                      {rows.length > PREVIEW && <button type="button" onClick={() => setOpen({ ...open, [t.id]: !open[t.id] })} style={{ width: '100%', padding: 11, background: '#FAFBFC', border: 'none', color: '#1F3A93', fontWeight: 500, fontSize: 13.5, cursor: 'pointer' }}>{open[t.id] ? 'Show fewer' : `Show all ${rows.length}`}</button>}
                    </Card>
                  </section>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
