// One definition of every exportable/selectable record column (list export, custom report builder).
import { TYPES, STATUS } from '../schema.js';
import { agencyName, authorNames, fmtDate, indexOf, nameOf, semesterName, unitLabel, userName } from './data.js';

export const COLUMNS = {
  id: { label: 'ID', get: (db, r) => r.id },
  type: { label: 'Type', get: (db, r) => TYPES[r.type].singular },
  title: { label: 'Title', get: (db, r) => r.title },
  authors: { label: 'Authors', get: (db, r) => authorNames(db, r) },
  numAuthors: { label: '# Authors', get: (db, r) => r.authors.length },
  unit: { label: 'College / Office', get: (db, r) => unitLabel(db, r) },
  course: { label: 'Course', get: (db, r) => (r.course ? nameOf(db, 'courses', r.course, 'code') : '') },
  year: { label: 'Academic Year', get: (db, r) => r.year },
  semester: { label: 'Semester', get: (db, r) => semesterName(db, r.semester) },
  funded: { label: 'Funding', get: (db, r) => (TYPES[r.type].funding ? (r.funded ? 'Funded' : 'Unfunded') : '') },
  fundingAgency: { label: 'Funding Agency', get: (db, r) => (TYPES[r.type].funding && r.funded ? agencyName(db, r) : '') },
  event: { label: 'Event', get: (db, r) => r.event },
  venue: { label: 'Venue', get: (db, r) => r.venue },
  eventDate: { label: 'Event Date', get: (db, r) => (r.eventDate ? fmtDate(r.eventDate) : '') },
  journal: { label: 'Journal', get: (db, r) => r.journal },
  issn: { label: 'ISSN', get: (db, r) => r.issn },
  volume: { label: 'Volume', get: (db, r) => r.volume },
  yearPublished: { label: 'Year Published', get: (db, r) => r.yearPublished || '' },
  doi: { label: 'DOI', get: (db, r) => r.doi },
  indexing: { label: 'Indexing', get: (db, r) => indexOf(db, r.indexing)?.name || '' },
  status: { label: 'Status', get: (db, r) => STATUS[r.status].label },
  createdBy: { label: 'Created By', get: (db, r) => userName(db, r.createdBy) },
  createdAt: { label: 'Created On', get: (db, r) => fmtDate(r.createdAt) },
};

// Columns that make sense for each record type (order = display order)
const common = ['id', 'title', 'authors', 'numAuthors', 'unit', 'year', 'semester'];
export const TYPE_COLUMNS = {
  'faculty-research': [...common, 'funded', 'fundingAgency', 'status', 'createdBy', 'createdAt'],
  'employee-research': [...common, 'funded', 'fundingAgency', 'status', 'createdBy', 'createdAt'],
  'presented-papers': [...common, 'event', 'venue', 'eventDate', 'funded', 'fundingAgency', 'status', 'createdBy', 'createdAt'],
  'published-journals': [...common, 'journal', 'issn', 'volume', 'yearPublished', 'doi', 'indexing', 'status', 'createdBy', 'createdAt'],
  'student-research': [...common, 'course', 'status', 'createdBy', 'createdAt'],
  all: ['id', 'type', 'title', 'authors', 'unit', 'year', 'semester', 'status', 'createdBy', 'createdAt'],
};

// Build export-ready head + rows for a set of records
export const tableFor = (db, type, rows, keys = TYPE_COLUMNS[type]) => ({
  head: keys.map((k) => COLUMNS[k].label),
  rows: rows.map((r) => keys.map((k) => COLUMNS[k].get(db, r))),
});
