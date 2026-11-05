// Dashboard: metric tiles, charts, recent activity — all computed live from the store and scoped to the user's role.
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card, CardTitle, ChartCanvas, FilterSelect, Icon, MetricCard } from '../components/ui.jsx';
import { getUser, useStore } from '../store.js';
import { TYPES, TYPE_LIST, STATUS } from '../schema.js';
import { canAudit, canCreateType, canReports, officialOnly, recordCollege } from '../perm.js';
import { applyFilters, authorNames, byId, nameOf, pct, timeAgo, visibleRecords } from '../lib/data.js';

const FKEY = 'plm-dash-filters';
const loadF = (d) => { try { return { ...d, ...JSON.parse(sessionStorage.getItem(FKEY)) }; } catch { return d; } };

export default function Dashboard() {
  const state = useStore();
  const { db } = state;
  const user = getUser(state);
  const scopedCollege = user.role === 'coordinator' ? user.college : '';
  const [f, setF] = useState(() => loadF({ year: db.settings.activeYear, semester: '', college: '' }));
  const set = (k) => (v) => { const n = { ...f, [k]: v }; setF(n); sessionStorage.setItem(FKEY, JSON.stringify(n)); };
  const college = scopedCollege || f.college;

  const base = useMemo(() => officialOnly(db, visibleRecords(db, user)), [db, user]);
  const rows = useMemo(() => applyFilters(db, base, { ...f, college }), [db, base, f, college]);
  const count = (t) => rows.filter((r) => r.type === t).length;

  // Outputs per college (employee research without an attached college falls under "Offices")
  const perCollege = useMemo(() => {
    const m = {};
    rows.forEach((r) => { const k = recordCollege(db, r) ? nameOf(db, 'colleges', recordCollege(db, r), 'abbr') : 'Offices'; m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [rows, db]);

  // Trend ignores the academic-year filter (it IS the year axis)
  const trend = useMemo(() => {
    const t = applyFilters(db, base, { semester: f.semester, college });
    const years = db.academicYears.map((y) => y.label).sort();
    const last = years.reduce((m, y, i) => (t.some((r) => r.year === y) ? i : m), 0);
    return years.slice(0, last + 1).map((y) => [y, t.filter((r) => r.year === y).length]);
  }, [db, base, f.semester, college]);

  const funded = rows.filter((r) => TYPES[r.type].funding && r.funded).length;
  const fundable = rows.filter((r) => TYPES[r.type].funding).length;
  const journals = rows.filter((r) => r.type === 'published-journals');
  const byIndex = db.indexing.map((i) => ({ ...i, n: journals.filter((j) => j.indexing === i.id).length }));
  const intl = byIndex.filter((i) => ['scopus', 'wos'].includes(i.id)).reduce((s, i) => s + i.n, 0);
  const activeColleges = new Set(rows.map((r) => recordCollege(db, r)).filter(Boolean)).size;

  // Recent activity from the audit log, scoped to what this user may see
  const activity = useMemo(() => db.audit.filter((a) => ['create', 'update', 'verify', 'return', 'delete'].includes(a.action) && a.recordId && /^[A-Z]{2}-\d+/.test(a.recordId)
    && (user.role === 'admin' || user.role === 'auditor' ? true : user.role === 'coordinator' ? a.college === user.college : a.userId === user.id)).slice(0, 6), [db.audit, user]);

  const mine = visibleRecords(db, user).filter((r) => r.createdBy === user.id || (user.personId && r.authors.includes(user.personId)));
  const contributor = ['faculty', 'student', 'employee'].includes(user.role);
  const addType = TYPE_LIST.find((t) => canCreateType(user, t.id));
  const ay = f.year ? `AY ${f.year}` : 'all academic years';
  const ctx = `${ay}${f.semester ? ` · ${nameOf(db, 'semesters', f.semester)}` : ''}${college ? ` · ${nameOf(db, 'colleges', college, 'abbr')}` : ''}`;
  const scopeNote = { coordinator: `Showing ${nameOf(db, 'colleges', user.college, 'abbr')} records only`, student: 'Showing your own records', employee: 'Showing your own records' }[user.role];

  return (
    <div className="page">
      <div className="page-head" style={{ marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Source Serif 4', serif" }}>Dashboard</h1>
          <p style={{ fontSize: 14, color: '#5C6B7A', marginTop: 3 }}>Research output summary for {ay}{scopeNote ? ` · ${scopeNote}` : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <FilterSelect label="Academic year" value={f.year} onChange={set('year')} placeholder="All years" options={db.academicYears.map((y) => y.label)} />
          <FilterSelect label="Semester" value={f.semester} onChange={set('semester')} placeholder="All semesters" options={db.semesters.map((s) => ({ value: s.id, label: s.name }))} />
          {scopedCollege ? <FilterSelect label="College" value={scopedCollege} onChange={() => {}} placeholder="" options={[{ value: scopedCollege, label: nameOf(db, 'colleges', scopedCollege, 'abbr') }]} style={{ background: '#F7F8FA' }} />
            : <FilterSelect label="College" value={f.college} onChange={set('college')} placeholder="All colleges" options={db.colleges.map((c) => ({ value: c.id, label: c.abbr }))} />}
        </div>
      </div>

      <div className="grid-metrics">
        <MetricCard label="Total Outputs" value={rows.length} icon="layers" sub={ctx} />
        {TYPE_LIST.map((t) => <MetricCard key={t.id} label={t.label} value={count(t.id)} icon={t.icon} iconColor={t.color} to={`/records/${t.id}`} />)}
      </div>

      <div className="grid-charts">
        <Card>
          <CardTitle title="Outputs per College" sub={ctx} />
          {perCollege.length ? <ChartCanvas type="bar" summary={`Bar chart of outputs per college: ${perCollege.map(([k, n]) => `${k} ${n}`).join(', ')}`}
            data={{ labels: perCollege.map(([k]) => k), datasets: [{ data: perCollege.map(([, n]) => n), backgroundColor: perCollege.map((_, i) => (i === 0 ? '#1F3A93' : '#6b82c2')), borderRadius: 4, borderSkipped: false }] }}
            options={{ plugins: { tooltip: { callbacks: { label: (c) => ` ${c.raw} output${c.raw !== 1 ? 's' : ''}` } } } }} /> : <NoData />}
        </Card>
        <Card>
          <CardTitle title="Research Output Trend" sub={`All types · ${college ? nameOf(db, 'colleges', college, 'abbr') : 'all colleges'}${f.semester ? ` · ${nameOf(db, 'semesters', f.semester)}` : ''}`} />
          <ChartCanvas type="line" summary={`Line chart of outputs by academic year: ${trend.map(([y, n]) => `${y} ${n}`).join(', ')}`}
            data={{ labels: trend.map(([y]) => y.replace(/^(\d{4})-\d{2}(\d{2})$/, '$1-$2')), datasets: [{ data: trend.map(([, n]) => n), borderColor: '#1F3A93', backgroundColor: 'rgba(31,58,147,0.07)', pointBackgroundColor: '#1F3A93', pointRadius: 5, tension: 0.35, fill: true, borderWidth: 2.5 }] }}
            options={{ plugins: { tooltip: { callbacks: { label: (c) => ` ${c.raw} total outputs` } } } }} />
        </Card>
        <Card>
          <CardTitle title="Distribution by Type" sub={ctx} />
          {rows.length ? <ChartCanvas type="doughnut" summary={`Donut chart by type: ${TYPE_LIST.map((t) => `${t.label} ${count(t.id)}`).join(', ')}`}
            data={{ labels: TYPE_LIST.map((t) => t.label), datasets: [{ data: TYPE_LIST.map((t) => count(t.id)), backgroundColor: TYPE_LIST.map((t) => t.color), borderWidth: 2, borderColor: '#fff', hoverOffset: 6 }] }}
            options={{ cutout: '62%', plugins: { legend: { display: true, position: 'bottom' } } }} /> : <NoData />}
        </Card>
      </div>

      <div className="grid-bottom">
        <Card>
          <CardTitle title="Recent Activity" sub="Latest records added or changed" right={canAudit(user) && <Link to="/admin/audit" style={{ fontSize: 13 }}>View audit log</Link>} />
          {activity.length === 0 && <p style={{ fontSize: 14, color: '#5C6B7A', padding: '12px 0' }}>No recent activity yet.</p>}
          {activity.map((a, i) => {
            const rec = db.records.find((r) => r.id === a.recordId);
            const verb = { create: 'added', update: 'edited', verify: 'verified', return: 'returned', delete: 'deleted' }[a.action];
            const inner = (
              <>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E9EDF7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={{ create: 'plus', update: 'edit', verify: 'check', return: 'undo', delete: 'trash' }[a.action]} size={14} color="#1F3A93" /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, lineHeight: 1.4 }}><span style={{ fontWeight: 600 }}>{a.userName}</span> {verb} a <span style={{ color: '#1F3A93' }}>{a.module}</span> record</div>
                  <div style={{ fontSize: 12.5, color: '#5C6B7A', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.recordTitle}</div>
                </div>
                <span style={{ fontSize: 11.5, color: '#6B7280', whiteSpace: 'nowrap' }}>{timeAgo(a.ts)}</span>
              </>
            );
            const st = { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 0', borderBottom: i < activity.length - 1 ? '1px solid #F0F2F4' : 'none', textDecoration: 'none', color: 'inherit' };
            return rec ? <Link key={a.id} to={`/records/${rec.type}/${rec.id}`} style={st}>{inner}</Link> : <div key={a.id} style={st}>{inner}</div>;
          })}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          {contributor && (
            <Card>
              <CardTitle title="My Outputs" sub="Records you authored or submitted" />
              {Object.entries(STATUS).map(([k, s]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13.5 }}><Badge variant={s.variant}>{s.label}</Badge><strong>{mine.filter((r) => r.status === k).length}</strong></div>
              ))}
              {addType && <Link to={`/records/${addType.id}`} style={{ display: 'inline-block', marginTop: 10, fontSize: 13 }}>Go to my {addType.label.toLowerCase()} →</Link>}
            </Card>
          )}
          <Card>
            <CardTitle title="Key Indicators" sub={ctx} />
            <Row label="Externally funded outputs" value={funded} />
            <div style={{ height: 6, background: '#F0F2F4', borderRadius: 99, margin: '2px 0 4px' }}><div style={{ height: '100%', width: pct(funded, fundable), background: '#2E7D4F', borderRadius: 99 }} /></div>
            <div style={{ fontSize: 12, color: '#5C6B7A', marginBottom: 10 }}>{pct(funded, fundable)} of funding-eligible outputs</div>
            <Row label="Scopus / Web of Science articles" value={intl} />
            <Row label="Active colleges" value={activeColleges} />
          </Card>
          <Card>
            <CardTitle title="Journals by Indexing" sub={ctx} />
            {byIndex.map((i) => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F7F8FA' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: i.color }} />{i.name}</span>
                <strong style={{ fontSize: 13 }}>{i.n}</strong>
              </div>
            ))}
          </Card>
          <Card>
            <CardTitle title="Quick Actions" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                canReports(user) && { to: '/reports', label: 'Generate Reports', icon: 'bar-chart' },
                { to: '/repository', label: 'Search Repository', icon: 'search' },
                addType && { to: `/records/${addType.id}?form=new`, label: `Add ${addType.singular}`, icon: 'plus' },
              ].filter(Boolean).map((q) => (
                <Link key={q.to} to={q.to} className="btn" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F7F8FA', border: '1.5px solid #D9DEE4', borderRadius: 6, padding: '9px 12px', fontSize: 13, fontWeight: 500, color: '#1F3A93', textDecoration: 'none' }}><Icon name={q.icon} size={14} color="#1F3A93" />{q.label}</Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const Row = ({ label, value }) => <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', fontSize: 13 }}><span style={{ color: '#5C6B7A' }}>{label}</span><strong style={{ fontSize: 14 }}>{value}</strong></div>;
const NoData = () => <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5C6B7A', fontSize: 14 }}>No records match the current filters.</div>;
