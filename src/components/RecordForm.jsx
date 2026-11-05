// Add/Edit record form. One component, driven by TYPES config, rendered either in a side drawer
// (short forms) or as a sectioned full page (Published Journal) — see pages/Records.jsx.
import React, { useState } from 'react';
import { Btn, FormField, Input, MultiSelect, Select, Textarea, useToast } from './ui.jsx';
import { getUser, saveRecord, useStore } from '../store.js';
import { TYPES } from '../schema.js';
import { byId, nameOf, options } from '../lib/data.js';
import { normalizeDoi, validateRecord } from '../lib/validate.js';

const CONTRIBUTORS = ['faculty', 'student', 'employee'];

export function blankRecord(type, db, user) {
  const t = TYPES[type];
  const r = { type, title: '', authors: [], college: '', office: '', course: '', year: db.settings.activeYear, semester: db.settings.defaultSemester, funded: false, fundingAgency: '',
    event: '', venue: '', eventDate: '', journal: '', issn: '', volume: '', yearPublished: '', doi: '', indexing: '' };
  if (user.role === 'coordinator') r.college = user.college; // college locked to the coordinator's own
  if (user.personId && CONTRIBUTORS.includes(user.role)) { // "My Research" flow: pre-fill the signed-in author
    const p = byId(db[t.people], user.personId);
    if (p) { r.authors = [p.id]; if (t.unit === 'office') r.office = p.office; else { r.college = p.college; if (t.course) r.course = p.course; } }
  }
  return r;
}

export function useRecordForm(type, record, onSaved) {
  const state = useStore();
  const { db } = state;
  const user = getUser(state);
  const toast = useToast();
  const [form, setForm] = useState(() => (record ? { ...blankRecord(type, db, user), ...record, funded: !!record.funded } : blankRecord(type, db, user)));
  const [errors, setErrors] = useState({});
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = () => {
    const rec = { ...form, doi: normalizeDoi(form.doi || ''), issn: (form.issn || '').trim().toUpperCase(), yearPublished: form.yearPublished ? Number(form.yearPublished) : null,
      fundingAgency: form.funded ? form.fundingAgency : null, title: form.title.trim(), college: form.college || null, office: form.office || null, course: form.course || null, indexing: form.indexing || null };
    const e = validateRecord(rec, db);
    setErrors(e);
    if (Object.keys(e).length) {
      toast('Please fix the highlighted fields before saving.', 'error');
      setTimeout(() => document.querySelector('[aria-invalid="true"]')?.focus(), 50);
      return;
    }
    const saved = saveRecord(rec);
    const contributor = CONTRIBUTORS.includes(user.role);
    toast(record ? (contributor ? 'Record updated and sent back for review.' : 'Record updated successfully.') : (contributor ? 'Record submitted — your coordinator will review it.' : 'New record added successfully.'), 'success');
    onSaved(saved);
  };
  return { form, set, errors, submit, db, user };
}

const Radio = ({ name, checked, onChange, children }) => (
  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14, marginRight: 18 }}>
    <input type="radio" name={name} checked={checked} onChange={onChange} style={{ accentColor: '#1F3A93' }} />{children}
  </label>
);

// The fields. `sections` = group labels shown as fieldsets on the full-page layout.
export function RecordFields({ type, ctl, sectioned }) {
  const { form, set, errors, db, user } = ctl;
  const t = TYPES[type];
  const isOffice = t.unit === 'office';
  const contributor = CONTRIBUTORS.includes(user.role);
  const people = db[t.people];
  const person = (id) => byId(people, id);
  const unitOf = (p) => (isOffice ? p.office : p.college);
  const lead = form.authors[0] || '';
  const co = form.authors.slice(1);
  const unitVal = isOffice ? form.office : form.college;

  const label = (p) => `${p.name}${!unitVal ? ` — ${isOffice ? nameOf(db, 'offices', p.office, 'code') : nameOf(db, 'colleges', p.college, 'abbr')}` : ''}`;
  const leadOptions = people.filter((p) => (p.active !== false || p.id === lead) && (!unitVal || unitOf(p) === unitVal)).map((p) => ({ value: p.id, label: label(p) }));
  const coOptions = people.filter((p) => (p.active !== false || co.includes(p.id)) && p.id !== lead)
    .map((p) => ({ value: p.id, label: `${p.name} — ${isOffice ? nameOf(db, 'offices', p.office, 'code') : nameOf(db, 'colleges', p.college, 'abbr')}` }));

  const setUnit = (v) => {
    const patch = isOffice ? { office: v } : { college: v };
    if (lead && person(lead) && unitOf(person(lead)) !== v) { patch.authors = []; } // lead no longer belongs to that unit
    if (t.course && db.courses.find((c) => c.id === form.course)?.college !== v) patch.course = '';
    set(patch);
  };
  const setLead = (v) => {
    const p = person(v);
    const patch = { authors: v ? [v, ...co.filter((c) => c !== v)] : co };
    if (p && !unitVal) patch[isOffice ? 'office' : 'college'] = unitOf(p); // unit defaults from the lead author
    if (p && t.course && !form.course && p.course) patch.course = p.course;
    set(patch);
  };
  const setCo = (v) => set({ authors: [...(lead ? [lead] : []), ...v] });

  const unitField = isOffice ? (
    <FormField label="Office" required error={errors.office}>
      <Select value={form.office} onChange={setUnit} error={errors.office} placeholder="Select office" disabled={contributor} options={options(db.offices, 'name', form.office)} />
    </FormField>
  ) : (
    <FormField label="College" required error={errors.college}>
      <Select value={form.college} onChange={setUnit} error={errors.college} placeholder="Select college" disabled={user.role === 'coordinator' || contributor} options={options(db.colleges, 'abbr', form.college)} />
    </FormField>
  );
  const office = isOffice ? byId(db.offices, form.office) : null;
  const peopleNoun = t.people === 'students' ? 'student' : t.people === 'employees' ? 'employee' : 'author';

  // Plain function (not a component) so inputs keep focus across re-renders.
  const group = (title, children) => (sectioned
    ? <fieldset key={title} id={`sec-${title.slice(0, 1)}`} style={{ border: '1px solid #D9DEE4', borderRadius: 8, padding: '18px 20px', margin: 0, scrollMarginTop: 12 }}><legend style={{ padding: '0 8px', fontWeight: 600, fontSize: 14, color: '#1F3A93' }}>{title}</legend><div className="form-stack">{children}</div></fieldset>
    : <React.Fragment key={title}>{children}</React.Fragment>);

  const authors = (
    <>
      <FormField label={`Lead ${peopleNoun}`} required error={errors.authors} hint={contributor ? 'You are the lead author of your submission.' : `Choose from the ${t.peopleLabel.toLowerCase()} master list.`}>
        <Select value={lead} onChange={setLead} error={errors.authors} placeholder={`Select lead ${peopleNoun}`} disabled={contributor} options={leadOptions} />
      </FormField>
      <FormField label={`Co-${peopleNoun}s`} hint={`# of ${t.people === 'students' ? 'students' : t.people === 'employees' ? 'employees' : 'authors'} = ${form.authors.length} (computed automatically)`}>
        <MultiSelect value={co} onChange={setCo} options={coOptions} placeholder={`Add co-${peopleNoun}s (optional)`} />
      </FormField>
    </>
  );
  const when = (
    <div className="form-grid">
      <FormField label="Academic year" required error={errors.year}><Select value={form.year} onChange={(v) => set({ year: v })} error={errors.year} placeholder="Select" options={db.academicYears.filter((y) => y.active !== false || y.id === form.year).map((y) => ({ value: y.id, label: y.label }))} /></FormField>
      <FormField label="Semester" required error={errors.semester}><Select value={form.semester} onChange={(v) => set({ semester: v })} error={errors.semester} placeholder="Select" options={options(db.semesters, 'name', form.semester)} /></FormField>
    </div>
  );
  const funding = t.funding && (
    <div className="form-stack" style={{ gap: 12 }}>
      <FormField label="Funded?">
        <div role="radiogroup" aria-label="Funded?">
          <Radio name="funded" checked={!form.funded} onChange={() => set({ funded: false, fundingAgency: '' })}>No</Radio>
          <Radio name="funded" checked={form.funded} onChange={() => set({ funded: true })}>Yes</Radio>
        </div>
      </FormField>
      {form.funded && <FormField label="Funding agency" required error={errors.fundingAgency}><Select value={form.fundingAgency || ''} onChange={(v) => set({ fundingAgency: v })} error={errors.fundingAgency} placeholder="Select funding agency" options={options(db.fundingAgencies, 'name', form.fundingAgency)} /></FormField>}
    </div>
  );

  const titleField = (
    <FormField label={t.journal ? 'Article title' : 'Research title'} required error={errors.title}>
      <Textarea value={form.title} onChange={(v) => set({ title: v })} rows={3} placeholder="Enter the full title" error={errors.title} />
    </FormField>
  );

  if (t.journal) {
    return (
      <div className="form-stack">
        {group('1 · Article', <>{titleField}{authors}</>)}
        {group('2 · Journal', <>
          <FormField label="Journal name" required error={errors.journal}><Input value={form.journal} onChange={(v) => set({ journal: v })} placeholder="Full journal name" error={errors.journal} /></FormField>
          <div className="form-grid">
            <FormField label="ISSN" error={errors.issn} hint="Format: 1234-567X"><Input value={form.issn} onChange={(v) => set({ issn: v })} placeholder="0000-0000" error={errors.issn} /></FormField>
            <FormField label="Volume number"><Input value={form.volume} onChange={(v) => set({ volume: v })} placeholder="e.g. 24" /></FormField>
          </div>
          <div className="form-grid">
            <FormField label="Year published" required error={errors.yearPublished}><Input type="number" value={form.yearPublished} onChange={(v) => set({ yearPublished: v })} placeholder="e.g. 2025" error={errors.yearPublished} min="2000" max={new Date().getFullYear()} /></FormField>
            <FormField label="DOI" error={errors.doi} hint="Rendered as a clickable link"><Input value={form.doi} onChange={(v) => set({ doi: v })} placeholder="10.xxxx/xxxxxx" error={errors.doi} prefix="DOI" /></FormField>
          </div>
        </>)}
        {group('3 · Indexing', <FormField label="Indexing category" required error={errors.indexing}><Select value={form.indexing || ''} onChange={(v) => set({ indexing: v })} error={errors.indexing} placeholder="Select indexing" options={options(db.indexing, 'name', form.indexing)} /></FormField>)}
        {group('4 · Context', <>{unitField}{when}</>)}
      </div>
    );
  }

  return (
    <div className="form-stack">
      {titleField}
      {unitField}
      {isOffice && office && <FormField label="Office category"><Input value={office.category} readOnly /></FormField>}
      {t.course && (
        <FormField label="Course" required error={errors.course}>
          <Select value={form.course || ''} onChange={(v) => set({ course: v })} error={errors.course} disabled={!form.college} placeholder={form.college ? 'Select course' : 'Select a college first'}
            options={options(db.courses.filter((c) => c.college === form.college), 'name', form.course)} />
        </FormField>
      )}
      {when}
      {authors}
      {t.event && (
        <>
          <FormField label="Event / conference title" required error={errors.event}><Input value={form.event} onChange={(v) => set({ event: v })} placeholder="Full name of the conference or event" error={errors.event} /></FormField>
          <div className="form-grid">
            <FormField label="Venue" required error={errors.venue}><Input value={form.venue} onChange={(v) => set({ venue: v })} placeholder="City, Country" error={errors.venue} /></FormField>
            <FormField label="Event date" required error={errors.eventDate}><Input type="date" value={form.eventDate} onChange={(v) => set({ eventDate: v })} error={errors.eventDate} /></FormField>
          </div>
        </>
      )}
      {funding}
    </div>
  );
}

export const FormFooter = ({ onCancel, onSave, editing }) => (
  <>
    <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
    <Btn onClick={onSave}>{editing ? 'Save changes' : 'Add record'}</Btn>
  </>
);
