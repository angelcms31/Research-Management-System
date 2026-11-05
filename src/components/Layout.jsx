// App shell: dark-navy sidebar (design: seal on a white panel), top bar with breadcrumbs, search, notifications, user menu.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Icon, useToast } from './ui.jsx';
import { getState, getUser, logout, touch, useStore } from '../store.js';
import { FEEDBACK_URL, MASTERS, ROLES, TYPES } from '../schema.js';
import { canApprove, canAudit, canReports, canRoute, isAdmin, visibleTypes } from '../perm.js';
import { timeAgo, visibleRecords } from '../lib/data.js';

const NAV = (u) => [
  { group: 'Overview', items: [{ to: '/dashboard', label: 'Dashboard', icon: 'grid' }] },
  { group: 'Research Records', items: visibleTypes(u).map((t) => ({ to: `/records/${t.id}`, label: t.label, icon: t.icon })) },
  { group: 'Analytics', items: [
    ...(canReports(u) ? [{ to: '/reports', label: 'Reports & Analytics', icon: 'bar-chart' }] : []),
    { to: '/repository', label: 'Repository Search', icon: 'search' },
  ] },
  { group: 'System', items: [
    ...(isAdmin(u) ? [{ to: '/maintenance', label: 'Maintenance', icon: 'settings' }] : []),
    ...(canAudit(u) || isAdmin(u) ? [{ to: isAdmin(u) ? '/admin' : '/admin/audit', match: '/admin', label: 'Administration', icon: 'shield' }] : []),
  ] },
].filter((g) => g.items.length);

const initials = (name) => name.replace(/^(Dr|Prof|Atty|Mr|Ms)\.\s*/, '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

function Sidebar({ user, collapsed, open, onNavigate }) {
  const { pathname } = useLocation();
  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}${open ? ' open' : ''}`} aria-label="Main navigation">
      <div style={{ padding: collapsed ? '16px 8px' : '16px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <Link to="/dashboard" onClick={onNavigate} style={{ background: '#fff', borderRadius: 8, padding: collapsed ? 8 : '10px 12px', display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start', textDecoration: 'none' }}>
          <img src="./plm-seal.png" alt="PLM seal" style={{ width: collapsed ? 28 : 36, height: collapsed ? 28 : 36, objectFit: 'contain', flexShrink: 0 }} />
          {!collapsed && <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1F3A93', letterSpacing: '0.04em', textTransform: 'uppercase' }}>PLM–RMS</div>
            <div style={{ fontSize: 10, color: '#5C6B7A', whiteSpace: 'nowrap' }}>Research Mgmt. System</div>
          </div>}
        </Link>
      </div>
      <nav style={{ flex: 1, padding: collapsed ? '12px 8px' : '12px 10px', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV(user).map((g) => (
          <div key={g.group} style={{ marginBottom: 20 }}>
            {!collapsed && <div style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 6px', marginBottom: 4 }}>{g.group}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {g.items.map((it) => {
                const active = pathname === it.to || pathname.startsWith(`${it.match || it.to}/`) || pathname === (it.match || it.to);
                return (
                  <NavLink key={it.to} to={it.to} onClick={onNavigate} title={collapsed ? it.label : undefined} aria-current={active ? 'page' : undefined}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '9px 0' : '9px 14px', justifyContent: collapsed ? 'center' : 'flex-start', background: active ? 'rgba(200,161,42,0.18)' : 'transparent', borderRadius: 6,
                      color: active ? '#C8A12A' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: active ? 600 : 400, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    <Icon name={it.icon} size={17} color={active ? '#C8A12A' : 'rgba(255,255,255,0.7)'} strokeWidth={active ? 2 : 1.75} />
                    {!collapsed && <span>{it.label}</span>}
                    {!collapsed && active && <span style={{ marginLeft: 'auto', width: 4, height: 4, background: '#C8A12A', borderRadius: '50%' }} />}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div style={{ padding: collapsed ? '12px 8px' : '12px 10px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer" title="Send feedback (opens GitHub Issues)" style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '9px 0' : '9px 14px', marginBottom: 8, borderRadius: 6, border: '1px dashed rgba(200,161,42,0.6)', color: '#C8A12A', fontSize: 14, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
          <Icon name="external" size={16} color="#C8A12A" />{!collapsed && 'Give feedback'}
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '6px 0' : '8px 10px', background: 'rgba(255,255,255,0.07)', borderRadius: 6, justifyContent: collapsed ? 'center' : 'flex-start' }}>
          {!collapsed && <>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#1F3A93', border: '2px solid rgba(200,161,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#C8A12A', flexShrink: 0 }}>{initials(user.name)}</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.92)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ROLES[user.role].label}</div>
            </div>
          </>}
          <button type="button" onClick={() => logout()} title="Sign out" aria-label="Sign out" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}><Icon name="logout" size={15} color="rgba(255,255,255,0.7)" /></button>
        </div>
      </div>
    </aside>
  );
}

// Breadcrumb trail derived from the URL; every ancestor is a link.
function crumbsFor(path, db) {
  const [, a, b, c, d] = path.split('/');
  const home = { label: 'Dashboard', to: '/dashboard' };
  if (a === 'records' && TYPES[b]) {
    const base = [{ label: 'Research Records' }, { label: TYPES[b].label, to: `/records/${b}` }];
    if (!c) return base;
    if (c === 'new') return [...base, { label: 'Add record' }];
    const id = db.records.find((r) => r.id === c)?.id || c;
    return d === 'edit' ? [...base, { label: id, to: `/records/${b}/${c}` }, { label: 'Edit' }] : [...base, { label: id }];
  }
  if (a === 'reports') return [{ label: 'Analytics' }, { label: 'Reports & Analytics' }];
  if (a === 'repository') return [{ label: 'Analytics' }, { label: 'Repository Search' }];
  if (a === 'maintenance') return [{ label: 'System' }, { label: 'Maintenance', to: '/maintenance' }, ...(MASTERS[b] ? [{ label: MASTERS[b].title }] : [])];
  if (a === 'admin') return [{ label: 'System' }, { label: 'Administration' }, { label: { users: 'Users & Roles', audit: 'Audit Log', settings: 'System Settings' }[b] || '' }].filter((x) => x.label);
  return [a === 'dashboard' ? { label: 'Dashboard' } : home];
}

function Bell({ user, db }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const items = useMemo(() => {
    const mine = visibleRecords(db, user);
    const toReview = mine.filter((r) => canApprove(db, user, r)).map((r) => ({ r, text: 'Awaiting your verification' }));
    const own = mine.filter((r) => (r.status === 'returned' || r.status === 'pending') && !canApprove(db, user, r) && r.createdBy === user.id)
      .map((r) => ({ r, text: r.status === 'returned' ? `Returned: ${r.returnReason}` : 'Submitted — awaiting review' }));
    return [...toReview, ...own];
  }, [db, user]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" className="btn" onClick={() => setOpen(!open)} aria-label={`Notifications${items.length ? `, ${items.length} new` : ''}`} aria-expanded={open}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 7, position: 'relative', borderRadius: 6, display: 'flex' }}>
        <Icon name="bell" size={18} color="#5C6B7A" />
        {items.length > 0 && <span style={{ position: 'absolute', top: 3, right: 3, minWidth: 15, height: 15, padding: '0 3px', background: '#9B1B1B', borderRadius: 8, border: '1.5px solid #fff', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{items.length}</span>}
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', width: 'min(340px, 92vw)', background: '#fff', border: '1px solid #D9DEE4', borderRadius: 8, boxShadow: '0 8px 28px rgba(0,0,0,.14)', zIndex: 300 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #F0F2F4', fontWeight: 600, fontSize: 14 }}>Notifications</div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {items.length === 0 && <div style={{ padding: 20, fontSize: 13.5, color: '#5C6B7A', textAlign: 'center' }}>You’re all caught up.</div>}
            {items.map(({ r, text }) => (
              <Link key={r.id} to={`/records/${r.type}/${r.id}`} onClick={() => setOpen(false)} style={{ display: 'block', padding: '10px 16px', borderBottom: '1px solid #F7F8FA', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                <div style={{ fontSize: 12, color: '#5C6B7A' }}>{TYPES[r.type].label} · {text}</div>
                <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>{timeAgo(r.updatedAt)}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" className="btn" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="User menu" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', border: '1.5px solid #D9DEE4', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>
        <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#1F3A93', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#C8A12A' }}>{initials(user.name)}</span>
        <span className="user-chip-text" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, textAlign: 'left' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{user.name.split(' ').slice(-1)[0]}</span>
          <span style={{ fontSize: 11, color: '#5C6B7A' }}>{ROLES[user.role].short}</span>
        </span>
        <Icon name="chevron-down" size={13} color="#5C6B7A" />
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', width: 260, background: '#fff', border: '1px solid #D9DEE4', borderRadius: 8, boxShadow: '0 8px 28px rgba(0,0,0,.14)', zIndex: 300 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0F2F4' }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div>
            <div style={{ fontSize: 12.5, color: '#5C6B7A' }}>{ROLES[user.role].label}</div>
            <div style={{ fontSize: 12.5, color: '#5C6B7A' }}>{user.email}</div>
          </div>
          <button type="button" onClick={() => logout()} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#9B1B1B', textAlign: 'left' }}>
            <Icon name="logout" size={15} color="#9B1B1B" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function Forbidden() {
  const toast = useToast();
  useEffect(() => { toast('You do not have access to that page.', 'error'); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <Navigate to="/dashboard" replace />;
}

export default function Shell() {
  const state = useStore();
  const { db } = state;
  const user = getUser(state);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState('');
  const mainRef = useRef(null);

  useEffect(() => { setMobileOpen(false); mainRef.current?.scrollTo(0, 0); }, [pathname]);

  // Idle-session expiry (FR-05): activity refreshes the timer; checked every 30 s.
  useEffect(() => {
    if (!user) return undefined;
    let last = 0;
    const bump = () => { const n = Date.now(); if (n - last > 5000) { last = n; touch(); } };
    const evs = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    evs.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const t = setInterval(() => {
      const s = getUser();
      if (s && Date.now() - (getState().session?.lastActive || 0) > db.settings.idleMinutes * 60000) {
        sessionStorage.setItem('plm-idle', '1');
        logout('Session expired after inactivity');
      }
    }, 30000);
    return () => { evs.forEach((e) => window.removeEventListener(e, bump)); clearInterval(t); };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return <Navigate to="/login" replace state={{ from: pathname }} />;
  if (!canRoute(user, pathname)) return <Forbidden />;

  const crumbs = crumbsFor(pathname, db);
  const submitSearch = (e) => { e.preventDefault(); if (q.trim()) { navigate(`/repository?q=${encodeURIComponent(q.trim())}`); setQ(''); } else toast('Type a title, author or keyword to search.', 'info'); };

  return (
    <div className="shell">
      <Sidebar user={user} collapsed={collapsed} open={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      <div className={`sidebar-overlay${mobileOpen ? ' open' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className="main-col">
        <header className="topbar">
          <button type="button" className="btn hamburger" onClick={() => setMobileOpen(true)} aria-label="Open menu" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}><Icon name="menu" size={20} color="#5C6B7A" /></button>
          <button type="button" className="btn desktop-only" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 5, display: 'flex' }}>
            <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} size={18} color="#5C6B7A" />
          </button>
          <nav className="crumbs" aria-label="Breadcrumb">
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Icon name="chevron-right" size={14} color="#C0C6CE" />}
                {c.to && i < crumbs.length - 1 ? <Link to={c.to}>{c.label}</Link>
                  : <span style={{ color: i === crumbs.length - 1 ? '#1F2933' : '#5C6B7A', fontWeight: i === crumbs.length - 1 ? 600 : 400 }} aria-current={i === crumbs.length - 1 ? 'page' : undefined}>{c.label}</span>}
              </React.Fragment>
            ))}
          </nav>
          <form onSubmit={submitSearch} className="top-search" role="search">
            <div style={{ position: 'relative' }}>
              <Icon name="search" size={15} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search records…" aria-label="Search the repository"
                style={{ width: '100%', padding: '7px 12px 7px 32px', border: '1.5px solid #D9DEE4', borderRadius: 6, fontSize: 13, color: '#1F2933', background: '#F7F8FA' }} />
            </div>
          </form>
          <Bell user={user} db={db} />
          <UserMenu user={user} />
        </header>
        <main ref={mainRef} style={{ flex: 1, overflowY: 'auto', background: '#F7F8FA' }}><Outlet /></main>
      </div>
    </div>
  );
}
