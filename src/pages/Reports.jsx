// Reports & Analytics: picker on the left, live preview + export on the right (wireframe 6A).
// Reports cover Documentation R-01…R-11; the Custom Builder lets users compose their own.
import React, { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Btn, Card, CardTitle, ChartCanvas, EmptyState, FilterSelect, FormField, Icon, PageHeader, Select } from '../components/ui.jsx';
import ExportMenu from '../components/ExportMenu.jsx';
import { getUser, useStore } from '../store.js';
import { TYPE_LIST, TYPES, STATUS } from '../schema.js';
import { officialOnly, recordCollege } from '../perm.js';
import { applyFilters, authorNames, byId, nameOf, pct, semesterName, unitLabel, useSessionState, visibleRecords } from '../lib/data.js';
import { COLUMNS, TYPE_COLUMNS, tableFor } from '../lib/columns.js';
import NotFound from './NotFound.jsx';

const FAC_TYPES = ['faculty-research', 'presented-papers', 'published-journals'];
const typeCols = TYPE_LIST.map((t) => t.label);
const count = (rows, fn) => rows.filter(fn).length;
const byType = (rows, type) => count(rows, (r) => r.type === type);
// College key: college id, or 'offices' for employee research with no attached college
const collegeKey = (db, r) => recordCollege(db, r) || 'offices';

// Each report: build({ db, rows (filtered), base (visible, unfiltered by year), f, user }) → { head, rows, subs?, totals?, chart?, note? }
const REPORTS = [
  { id: 'per-college', code: 'R-05 · R-08', label: 'Research per College', desc: 'Outputs per college by type, with institution total.',
    build({ db, rows }) {
      const keys = [...db.colleges.map((c) => c.id), 'offices'];
      const lines = keys.map((k) => { const rs = rows.filter((r) => collegeKey(db, r) === k); return { k, rs }; }).filter((x) => x.rs.length)
        .map((x) => ({ label: x.k === 'offices' ? 'Offices (non-teaching)' : nameOf(db, 'colleges', x.k, 'abbr'), full: x.k === 'offices' ? '' : nameOf(db, 'colleges', x.k), rs: x.rs }))
        .sort((a, b) => b.rs.length - a.rs.length);
      return {
        head: ['College', ...typeCols, 'Total'],
        rows: lines.map((l) => [l.full ? `${l.label} — ${l.full}` : l.label, ...TYPE_LIST.map((t) => byType(l.rs, t.id)), l.rs.length]),
        totals: ['TOTAL', ...TYPE_LIST.map((t) => byType(rows, t.id)), rows.length],
        chart: lines.length ? { type: 'bar', summary: `Stacked bar of outputs per college: ${lines.map((l) => `${l.label} ${l.rs.length}`).join(', ')}`,
          data: { labels: lines.map((l) => l.label), datasets: TYPE_LIST.map((t) => ({ label: t.label, data: lines.map((l) => byType(l.rs, t.id)), backgroundColor: t.color, borderRadius: 3 })) },
          options: { plugins: { legend: { display: true, position: 'bottom' } }, scales: { x: { stacked: true }, y: { stacked: true } } } } : null,
      };
    } },
  { id: 'college-detail', code: 'R-02 · R-04', label: 'College Research Listing', desc: 'Every output grouped by college, then type.',
    build({ db, rows }) {
      const out = []; const subs = new Set();
      const keys = [...db.colleges.map((c) => c.id), 'offices'];
      keys.forEach((k) => {
        const rs = rows.filter((r) => collegeKey(db, r) === k).sort((a, b) => a.type.localeCompare(b.type) || a.year.localeCompare(b.year));
        if (!rs.length) return;
        subs.add(out.length);
        out.push([`${k === 'offices' ? 'Offices (non-teaching)' : `${nameOf(db, 'colleges', k, 'abbr')} — ${nameOf(db, 'colleges', k)}`} · ${rs.length} output${rs.length > 1 ? 's' : ''}`, '', '', '', '', '']);
        rs.forEach((r) => out.push([unitLabel(db, r), TYPES[r.type].singular, r.title, authorNames(db, r), r.year, semesterName(db, r.semester)]));
      });
      return { head: ['Unit', 'Type', 'Title', 'Authors', 'Academic Year', 'Semester'], rows: out, subs, totals: ['TOTAL', '', `${rows.length} outputs`, '', '', ''] };
    } },
  { id: 'per-faculty', code: 'R-01 · R-06', label: 'Research per Faculty', desc: 'Faculty outputs by member, with college subtotals.',
    build({ db, rows }) {
      const out = []; const subs = new Set();
      let tot = [0, 0, 0, 0];
      db.colleges.forEach((c) => {
        const lines = db.faculty.filter((p) => p.college === c.id).map((p) => {
          const mine = rows.filter((r) => FAC_TYPES.includes(r.type) && r.authors.includes(p.id));
          return { p, n: FAC_TYPES.map((t) => byType(mine, t)), total: mine.length };
        }).filter((l) => l.total).sort((a, b) => b.total - a.total);
        if (!lines.length) return;
        lines.forEach((l) => out.push([l.p.name, c.abbr, ...l.n, l.total]));
        const sub = [0, 1, 2, 3].map((i) => lines.reduce((s, l) => s + (i < 3 ? l.n[i] : l.total), 0));
        subs.add(out.length);
        out.push([`${c.abbr} subtotal`, '', ...sub]);
        tot = tot.map((v, i) => v + sub[i]);
      });
      return { head: ['Faculty member', 'College', 'Faculty Research', 'Presented Papers', 'Published Journals', 'Total'], rows: out, subs, totals: ['TOTAL', '', ...tot],
        note: 'A multi-author output counts once for each author.' };
    } },
  { id: 'per-student', code: 'R-03 · R-07', label: 'Research per Student', desc: 'Student research by student, college and course.',
    build({ db, rows }) {
      const out = []; const subs = new Set(); let total = 0;
      db.colleges.forEach((c) => {
        const lines = db.students.filter((s) => s.college === c.id).map((s) => ({ s, n: count(rows, (r) => r.type === 'student-research' && r.authors.includes(s.id)) })).filter((l) => l.n).sort((a, b) => b.n - a.n);
        if (!lines.length) return;
        lines.forEach((l) => out.push([l.s.name, l.s.studentNo, c.abbr, nameOf(db, 'courses', l.s.course, 'code'), l.n]));
        const sub = lines.reduce((s, l) => s + l.n, 0);
        subs.add(out.length); out.push([`${c.abbr} subtotal`, '', '', '', sub]); total += sub;
      });
      return { head: ['Student', 'Student no.', 'College', 'Course', 'Student Research'], rows: out, subs, totals: ['TOTAL', '', '', '', total] };
    } },
  { id: 'per-office', code: 'Employee', label: 'Research per Office', desc: 'Employee research by office and office category.',
    build({ db, rows }) {
      const er = rows.filter((r) => r.type === 'employee-research');
      const lines = db.offices.map((o) => { const rs = er.filter((r) => r.office === o.id); return { o, rs }; }).filter((l) => l.rs.length).sort((a, b) => b.rs.length - a.rs.length);
      return {
        head: ['Office', 'Category', 'Employee Research', 'Funded', 'Employees involved'],
        rows: lines.map((l) => [l.o.name, l.o.category, l.rs.length, count(l.rs, (r) => r.funded), new Set(l.rs.flatMap((r) => r.authors)).size]),
        totals: ['TOTAL', '', er.length, count(er, (r) => r.funded), new Set(er.flatMap((r) => r.authors)).size],
        chart: lines.length ? { type: 'bar', summary: `Bar chart of employee research per office: ${lines.map((l) => `${l.o.code} ${l.rs.length}`).join(', ')}`,
          data: { labels: lines.map((l) => l.o.code), datasets: [{ data: lines.map((l) => l.rs.length), backgroundColor: '#9B1B1B', borderRadius: 4 }] } } : null,
      };
    } },
  { id: 'per-employee', code: 'Employee', label: 'Research per Employee', desc: 'Employee research by person and office.',
    build({ db, rows }) {
      const lines = db.employees.map((e) => ({ e, n: count(rows, (r) => r.type === 'employee-research' && r.authors.includes(e.id)) })).filter((l) => l.n).sort((a, b) => b.n - a.n);
      return { head: ['Employee', 'Employee ID', 'Office', 'Position', 'Employee Research'], rows: lines.map((l) => [l.e.name, l.e.employeeNo, nameOf(db, 'offices', l.e.office), l.e.position, l.n]), totals: ['TOTAL', '', '', '', lines.reduce((s, l) => s + l.n, 0)] };
    } },
  { id: 'by-index', code: 'R-09', label: 'By Indexing Category', desc: 'Published journals grouped by index, with share of total.',
    build({ db, rows }) {
      const js = rows.filter((r) => r.type === 'published-journals');
      const out = []; const subs = new Set();
      const shown = db.indexing.map((i) => ({ i, rs: js.filter((j) => j.indexing === i.id) }));
      shown.filter((x) => x.rs.length).forEach(({ i, rs }) => {
        subs.add(out.length);
        out.push([`${i.name} — ${rs.length} article${rs.length > 1 ? 's' : ''} (${pct(rs.length, js.length)})`, '', '', '', '']);
        rs.forEach((j) => out.push([j.title, authorNames(db, j), unitLabel(db, j), j.journal, j.yearPublished]));
      });
      return { head: ['Article', 'Authors', 'College', 'Journal', 'Year published'], rows: out, subs, totals: ['TOTAL', '', '', '', `${js.length} articles`],
        chart: js.length ? { type: 'doughnut', summary: `Donut chart of journals by index: ${shown.map(({ i, rs }) => `${i.name} ${rs.length}`).join(', ')}`,
          data: { labels: shown.map(({ i }) => i.name), datasets: [{ data: shown.map(({ rs }) => rs.length), backgroundColor: shown.map(({ i }) => i.color), borderWidth: 2, borderColor: '#fff' }] },
          options: { cutout: '62%', plugins: { legend: { display: true, position: 'right' } } } } : null };
    } },
  { id: 'by-semester', code: 'R-10', label: 'Semester-Based Report', desc: 'Output volume per semester within each academic year.',
    build({ db, rows }) {
      const out = []; const lines = [];
      db.academicYears.map((y) => y.label).sort().forEach((y) => db.semesters.forEach((s) => {
        const rs = rows.filter((r) => r.year === y && r.semester === s.id);
        if (rs.length) { out.push([y, s.name, ...TYPE_LIST.map((t) => byType(rs, t.id)), rs.length]); lines.push([`${y.slice(2)} ${s.name.slice(0, 3)}`, rs.length]); }
      }));
      return { head: ['Academic Year', 'Semester', ...typeCols, 'Total'], rows: out, totals: ['TOTAL', '', ...TYPE_LIST.map((t) => byType(rows, t.id)), rows.length],
        chart: lines.length ? { type: 'bar', summary: `Bar chart of outputs per semester: ${lines.map(([l, n]) => `${l} ${n}`).join(', ')}`, data: { labels: lines.map(([l]) => l), datasets: [{ data: lines.map(([, n]) => n), backgroundColor: '#1F3A93', borderRadius: 4 }] } } : null };
    } },
  { id: 'trend', code: 'R-11', label: 'Yearly Trend', desc: 'Output counts across academic years with year-over-year change.', ignoreYear: true,
    build({ db, rows }) {
      const years = db.academicYears.map((y) => y.label).sort();
      const last = years.reduce((m, y, i) => (rows.some((r) => r.year === y) ? i : m), 0);
      const lines = years.slice(0, last + 1).map((y) => ({ y, rs: rows.filter((r) => r.year === y) }));
      const out = lines.map((l, i) => {
        const prev = i ? lines[i - 1].rs.length : null;
        const chg = prev === null ? '—' : prev === 0 ? (l.rs.length ? 'new' : '0%') : `${l.rs.length >= prev ? '+' : ''}${Math.round(((l.rs.length - prev) / prev) * 100)}%`;
        return [l.y, ...TYPE_LIST.map((t) => byType(l.rs, t.id)), l.rs.length, chg];
      });
      return { head: ['Academic Year', ...typeCols, 'Total', 'YoY change'], rows: out, totals: ['TOTAL', ...TYPE_LIST.map((t) => byType(rows, t.id)), rows.length, ''],
        chart: lines.length ? { type: 'line', summary: `Line chart of outputs by year: ${lines.map((l) => `${l.y} ${l.rs.length}`).join(', ')}`,
          data: { labels: lines.map((l) => l.y), datasets: [{ data: lines.map((l) => l.rs.length), borderColor: '#1F3A93', backgroundColor: 'rgba(31,58,147,.08)', fill: true, tension: 0.35, borderWidth: 2.5, pointRadius: 5 }] } } : null,
        note: 'Trend covers all academic years, so the academic-year filter is not applied.' };
    } },
];

export default function Reports() {
  const { id } = useParams();
  if (!id) return <Navigate to="/reports/per-college" replace />;
  if (id !== 'custom' && !REPORTS.find((r) => r.id === id)) return <NotFound />;
  return <ReportScreen id={id} />;
}

function ReportScreen({ id }) {
  const state = useStore();
  const { db } = state;
  const user = getUser(state);
  const nav = useNavigate();
  const [sf, setSf] = useSessionState('plm-report-filters', { year: db.settings.activeYear, semester: '', college: '' });
  const [b, setB] = useState({ type: 'all', cols: ['id', 'title', 'authors', 'unit', 'year', 'semester'], groupBy: '', funded: '', indexing: '' });
  const scoped = user.role === 'coordinator';
  const report = REPORTS.find((r) => r.id === id);
  const college = scoped ? user.college : sf.college;

  const base = useMemo(() => officialOnly(db, visibleRecords(db, user)), [db, user]);
  const rows = useMemo(() => applyFilters(db, base, { year: report?.ignoreYear ? '' : sf.year, semester: sf.semester, college }), [db, base, sf, college, report]);

  const built = useMemo(() => {
    if (report) return report.build({ db, rows, base, user });
    // Custom builder
    let rs = rows.filter((r) => (b.type === 'all' || r.type === b.type) && (!b.funded || (TYPES[r.type].funding && (b.funded === 'yes') === !!r.funded)) && (!b.indexing || r.indexing === b.indexing));
    const keys = (b.cols.length ? b.cols : ['title']).filter((k) => TYPE_COLUMNS[b.type].includes(k));
    const gKey = { unit: (r) => unitLabel(db, r), year: (r) => r.year, semester: (r) => semesterName(db, r.semester), type: (r) => TYPES[r.type].label, indexing: (r) => nameOf(db, 'indexing', r.indexing), status: (r) => STATUS[r.status].label }[b.groupBy];
    const out = []; const subs = new Set();
    if (gKey) {
      const groups = [...new Set(rs.map(gKey))].sort();
      groups.forEach((g) => { const gr = rs.filter((r) => gKey(r) === g); subs.add(out.length); out.push([`${g} — ${gr.length} record${gr.length > 1 ? 's' : ''}`, ...keys.slice(1).map(() => '')]); tableFor(db, b.type, gr, keys).rows.forEach((x) => out.push(x)); });
    } else tableFor(db, b.type, rs, keys).rows.forEach((x) => out.push(x));
    return { head: keys.map((k) => COLUMNS[k].label), rows: out, subs, totals: [`TOTAL: ${rs.length} record${rs.length === 1 ? '' : 's'}`, ...keys.slice(1).map(() => '')] };
  }, [report, rows, base, db, user, b]);

  const title = report ? report.label : 'Custom Report';
  const filters = [!report?.ignoreYear && sf.year && `AY ${sf.year}`, sf.semester && semesterName(db, sf.semester), college && nameOf(db, 'colleges', college, 'abbr'), id === 'custom' && b.type !== 'all' && TYPES[b.type].label].filter(Boolean);
  const spec = () => ({ title, filters, head: built.head, rows: built.rows, totals: built.totals });
  const empty = built.rows.length === 0;

  return (
    <div className="page">
      <PageHeader title="Reports & Analytics" subtitle="Preview live results, then export to Excel or PDF." actions={<ExportMenu build={spec} variant="primary" label="Export report" />} />
      <div className="report-layout">
        <Card pad={false} style={{ overflow: 'hidden' }}>
          <nav aria-label="Reports">
            {[...REPORTS, { id: 'custom', code: 'Builder', label: 'Custom Report Builder' }].map((r) => {
              const on = r.id === id;
              return (
                <Link key={r.id} to={`/reports/${r.id}`} aria-current={on ? 'page' : undefined} style={{ display: 'block', padding: '11px 16px', textDecoration: 'none', borderLeft: `3px solid ${on ? '#C8A12A' : 'transparent'}`, background: on ? '#E9EDF7' : '#fff', borderBottom: '1px solid #F0F2F4', color: '#1F2933' }}>
                  <div style={{ fontSize: 14, fontWeight: on ? 600 : 500, color: on ? '#1F3A93' : '#1F2933', display: 'flex', alignItems: 'center', gap: 6 }}>{r.id === 'custom' && <Icon name="sliders" size={14} />}{r.label}</div>
                  <div style={{ fontSize: 11.5, color: '#6B7280' }}>{r.code}</div>
                </Link>
              );
            })}
          </nav>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            <Icon name="filter" size={14} color="#5C6B7A" /><span style={{ fontSize: 13, fontWeight: 500, color: '#5C6B7A' }}>Filters:</span>
            <FilterSelect label="Academic year" value={report?.ignoreYear ? '' : sf.year} onChange={(v) => setSf({ year: v })} placeholder="All years" options={db.academicYears.map((y) => y.label)} style={report?.ignoreYear ? { opacity: 0.5 } : {}} />
            <FilterSelect label="Semester" value={sf.semester} onChange={(v) => setSf({ semester: v })} placeholder="All semesters" options={db.semesters.map((s) => ({ value: s.id, label: s.name }))} />
            {scoped ? <FilterSelect label="College" value={college} onChange={() => {}} placeholder="" options={[{ value: college, label: nameOf(db, 'colleges', college, 'abbr') }]} style={{ background: '#F7F8FA' }} />
              : <FilterSelect label="College" value={sf.college} onChange={(v) => setSf({ college: v })} placeholder="All colleges" options={db.colleges.map((c) => ({ value: c.id, label: c.abbr }))} />}
            <span style={{ marginLeft: 'auto', fontSize: 13, color: '#5C6B7A' }}><strong style={{ color: '#1F2933' }}>{rows.length}</strong> record{rows.length === 1 ? '' : 's'} match</span>
          </div>

          {id === 'custom' && <Builder b={b} setB={setB} db={db} />}

          {built.chart && !empty && <Card><CardTitle title={title} sub={filters.join(' · ') || 'All records'} /><ChartCanvas height={260} {...built.chart} /></Card>}

          <Card pad={false} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #D9DEE4', display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
              <span style={{ fontSize: 13, color: '#5C6B7A' }}>{filters.join(' · ') || 'All academic years'}</span>
            </div>
            {empty ? <EmptyState icon="bar-chart" title="No data for these filters" desc="Change the filters above to see results." action={<Btn variant="secondary" onClick={() => { setSf({ year: '', semester: '', college: '' }); }}>Clear filters</Btn>} />
              : <div className="tbl-wrap"><table className="tbl">
                <thead><tr>{built.head.map((h, i) => <th key={i} className={i > 0 && typeof built.rows[0]?.[i] === 'number' ? 'num' : ''}>{h}</th>)}</tr></thead>
                <tbody>
                  {built.rows.map((r, i) => <tr key={i} className={built.subs?.has(i) ? 'group' : ''}>{r.map((v, j) => <td key={j} className={typeof v === 'number' ? 'num' : ''} style={typeof v === 'number' && !built.subs?.has(i) && j === r.length - 1 && r.length > 2 ? { fontWeight: 700, color: '#1F3A93' } : undefined}>{v === '' || v === null ? '—' : v}</td>)}</tr>)}
                  {built.totals && <tr className="total">{built.totals.map((v, j) => <td key={j} className={typeof v === 'number' ? 'num' : ''}>{v}</td>)}</tr>}
                </tbody></table></div>}
            {built.note && !empty && <div style={{ padding: '10px 20px', fontSize: 12, color: '#5C6B7A', borderTop: '1px solid #F0F2F4' }}>{built.note}</div>}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Builder({ b, setB, db }) {
  const t = TYPES[b.type];
  const avail = TYPE_COLUMNS[b.type];
  const toggle = (k) => setB({ ...b, cols: b.cols.includes(k) ? b.cols.filter((c) => c !== k) : [...b.cols, k].sort((x, y) => avail.indexOf(x) - avail.indexOf(y)) });
  const changeType = (type) => setB({ ...b, type, cols: ['id', 'title', 'authors', 'unit', 'year', 'semester'], groupBy: b.groupBy === 'indexing' && type !== 'published-journals' && type !== 'all' ? '' : b.groupBy, funded: '', indexing: '' });
  return (
    <Card>
      <CardTitle title="Build your report" sub="Pick the record type, choose columns, optionally group, and filter. The preview below updates instantly." />
      <div className="form-grid" style={{ marginBottom: 16 }}>
        <FormField label="Record type"><Select value={b.type} onChange={changeType} options={[{ value: 'all', label: 'All record types' }, ...TYPE_LIST.map((x) => ({ value: x.id, label: x.label }))]} /></FormField>
        <FormField label="Group by"><Select value={b.groupBy} onChange={(v) => setB({ ...b, groupBy: v })} placeholder="No grouping" options={[{ value: 'unit', label: 'College / Office' }, { value: 'year', label: 'Academic year' }, { value: 'semester', label: 'Semester' }, ...(b.type === 'all' ? [{ value: 'type', label: 'Record type' }] : []), ...(b.type === 'published-journals' ? [{ value: 'indexing', label: 'Indexing' }] : []), { value: 'status', label: 'Status' }]} /></FormField>
        {t?.funding && <FormField label="Funding"><Select value={b.funded} onChange={(v) => setB({ ...b, funded: v })} placeholder="Any" options={[{ value: 'yes', label: 'Funded only' }, { value: 'no', label: 'Unfunded only' }]} /></FormField>}
        {t?.journal && <FormField label="Indexing"><Select value={b.indexing} onChange={(v) => setB({ ...b, indexing: v })} placeholder="Any index" options={db.indexing.map((i) => ({ value: i.id, label: i.name }))} /></FormField>}
      </div>
      <fieldset style={{ border: 'none' }}>
        <legend style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Columns</legend>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px' }}>
          {avail.map((k) => <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}><input type="checkbox" checked={b.cols.includes(k)} onChange={() => toggle(k)} style={{ accentColor: '#1F3A93' }} />{COLUMNS[k].label}</label>)}
        </div>
      </fieldset>
    </Card>
  );
}
