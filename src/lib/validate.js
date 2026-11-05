// Form validation (Documentation §8.3). Returns { field: message }; empty object = valid.
import { TYPES, MASTERS } from '../schema.js';

const ISSN = /^\d{4}-\d{3}[\dXx]$/;
const DOI = /^10\.\d{4,9}\/\S+$/;

// "DOI: …" or "https://doi.org/…" → bare DOI
export const normalizeDoi = (v) => v.trim().replace(/^(doi:\s*|https?:\/\/(dx\.)?doi\.org\/)/i, '');

export function validateRecord(rec, db) {
  const t = TYPES[rec.type];
  const e = {};
  const title = rec.title.trim();
  if (!title) e.title = 'Title is required.';
  else if (title.length < 10) e.title = 'Title must be at least 10 characters.';
  else if (db.records.some((r) => r.type === rec.type && r.id !== rec.id && r.title.trim().toLowerCase() === title.toLowerCase())) e.title = 'A record with this title already exists.';

  if (t.unit === 'office' ? !rec.office : !rec.college) e[t.unit] = `${t.unit === 'office' ? 'Office' : 'College'} is required.`;
  if (!rec.authors.length) e.authors = `Select the lead ${t.people === 'students' ? 'student' : t.people === 'employees' ? 'employee' : 'author'}.`;
  if (!rec.year) e.year = 'Academic year is required.';
  if (!rec.semester) e.semester = 'Semester is required.';

  if (t.funding && rec.funded && !rec.fundingAgency) e.fundingAgency = 'Funding agency is required when the research is funded.';
  if (t.course) {
    if (!rec.course) e.course = 'Course is required.';
    else if (db.courses.find((c) => c.id === rec.course)?.college !== rec.college) e.course = 'The course must belong to the selected college.';
  }
  if (t.event) {
    if (!rec.event.trim()) e.event = 'Event title is required.';
    if (!rec.venue.trim()) e.venue = 'Venue is required.';
    if (!rec.eventDate) e.eventDate = 'Event date is required.';
    else if (Number.isNaN(Date.parse(rec.eventDate))) e.eventDate = 'Enter a valid date.';
  }
  if (t.journal) {
    if (!rec.journal.trim()) e.journal = 'Journal name is required.';
    const y = Number(rec.yearPublished);
    if (!rec.yearPublished) e.yearPublished = 'Year published is required.';
    else if (!Number.isInteger(y) || y < 2000 || y > new Date().getFullYear()) e.yearPublished = `Enter a four-digit year between 2000 and ${new Date().getFullYear()}.`;
    if (rec.issn && !ISSN.test(rec.issn.trim())) e.issn = 'ISSN must look like 1234-567X.';
    if (rec.doi && !DOI.test(normalizeDoi(rec.doi))) e.doi = 'Enter a valid DOI, e.g. 10.1234/abcd.5678.';
    if (!rec.indexing) e.indexing = 'Indexing category is required.';
  }
  return e;
}

// Master-data form validation incl. duplicate prevention (FR-13). `self` = id being edited.
export function validateMaster(entity, form, db, self) {
  const e = {};
  for (const f of MASTERS[entity].fields) {
    const v = String(form[f.key] ?? '').trim();
    if (f.required && !v) { e[f.key] = `${f.label} is required.`; continue; }
    if (f.pattern && v) {
      const m = f.pattern.exec(v);
      if (!m || (entity === 'academicYears' && +m[2] !== +m[1] + 1)) e[f.key] = f.patternMsg;
    }
    if (f.unique && v && db[entity].some((x) => x.id !== self && String(x[f.key]).trim().toLowerCase() === v.toLowerCase())) e[f.key] = `${f.label} “${v}” already exists.`;
  }
  return e;
}

export const validateUser = (form, db) => {
  const e = {};
  if (!form.name.trim()) e.name = 'Full name is required.';
  if (!form.email.trim()) e.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email address.';
  if (!form.id || form.password !== undefined) {
    const p = form.password || '';
    if (!form.id && !p) e.password = 'Password is required.';
    else if (p && (p.length < 8 || !/[A-Za-z]/.test(p) || !/\d/.test(p))) e.password = 'Use at least 8 characters with letters and numbers.';
  }
  if (form.role === 'coordinator' && !form.college) e.college = 'A coordinator must be assigned to a college.';
  if (['faculty', 'student', 'employee'].includes(form.role) && !form.personId) e.personId = 'Link this account to a person from the master list.';
  return e;
};
