// Static configuration: record types, master-data entities, roles.
// Everything screen-related (lists, forms, reports, search) is driven from here.

export const SEMESTER_IDS = ['sem1', 'sem2', 'sem3'];
export const OFFICE_CATEGORIES = ['Administrative', 'Academic Support', 'Maintenance', 'Security'];

// ─── Research record types ─────────────────────────────────────────────────────
// people:  master list that supplies authors   unit: what classifies the record (college | office)
export const TYPES = {
  'faculty-research': {
    id: 'faculty-research', label: 'Faculty Research', singular: 'Faculty Research', short: 'Faculty',
    icon: 'file-text', prefix: 'FR', people: 'faculty', unit: 'college', funding: true, color: '#1F3A93',
    layout: 'drawer', peopleLabel: 'Faculty',
  },
  'employee-research': {
    id: 'employee-research', label: 'Employee Research', singular: 'Employee Research', short: 'Employee',
    icon: 'briefcase', prefix: 'ER', people: 'employees', unit: 'office', funding: true, color: '#9B1B1B',
    layout: 'drawer', peopleLabel: 'Employees',
  },
  'presented-papers': {
    id: 'presented-papers', label: 'Presented Papers', singular: 'Presented Paper', short: 'Presented',
    icon: 'monitor', prefix: 'PP', people: 'faculty', unit: 'college', funding: true, event: true, color: '#C8A12A',
    layout: 'drawer', peopleLabel: 'Faculty',
  },
  'published-journals': {
    id: 'published-journals', label: 'Published Journals', singular: 'Published Journal', short: 'Journal',
    icon: 'book-open', prefix: 'PJ', people: 'faculty', unit: 'college', journal: true, color: '#2E7D4F',
    layout: 'page', peopleLabel: 'Faculty',
  },
  'student-research': {
    id: 'student-research', label: 'Student Research', singular: 'Student Research', short: 'Student',
    icon: 'graduation-cap', prefix: 'SR', people: 'students', unit: 'college', course: true, color: '#5C6B7A',
    layout: 'drawer', peopleLabel: 'Students',
  },
};
export const TYPE_LIST = Object.values(TYPES);

// ─── Master data (Maintenance) ─────────────────────────────────────────────────
// refs: [collection, field, isArray] — where an entry is used. `records` = db.records.
// field.source → lookup in another master; field.filterBy → options narrowed by another field of the form.
export const MASTERS = {
  colleges: {
    title: 'Colleges', singular: 'College', icon: 'layers',
    fields: [
      { key: 'abbr', label: 'Code', required: true, unique: true, upper: true, max: 8, placeholder: 'e.g. CET' },
      { key: 'name', label: 'College name', required: true, unique: true, wide: true },
    ],
    refs: [['courses', 'college'], ['faculty', 'college'], ['students', 'college'], ['offices', 'college'], ['users', 'college'], ['records', 'college']],
  },
  courses: {
    title: 'Courses', singular: 'Course', icon: 'graduation-cap',
    fields: [
      { key: 'code', label: 'Course code', required: true, unique: true, upper: true, max: 12, placeholder: 'e.g. BSCS' },
      { key: 'name', label: 'Course name', required: true, wide: true },
      { key: 'college', label: 'College', source: 'colleges', show: 'abbr', required: true },
    ],
    refs: [['students', 'course'], ['records', 'course']],
  },
  faculty: {
    title: 'Faculty', singular: 'Faculty member', icon: 'user',
    fields: [
      { key: 'name', label: 'Full name', required: true, unique: true, wide: true },
      { key: 'college', label: 'College', source: 'colleges', show: 'abbr', required: true },
      { key: 'rank', label: 'Rank / position', placeholder: 'e.g. Associate Professor' },
    ],
    refs: [['records', 'authors', true], ['users', 'personId']],
  },
  students: {
    title: 'Students', singular: 'Student', icon: 'graduation-cap',
    fields: [
      { key: 'studentNo', label: 'Student no.', required: true, unique: true, placeholder: '2021-00123' },
      { key: 'name', label: 'Full name', required: true, wide: true },
      { key: 'college', label: 'College', source: 'colleges', show: 'abbr', required: true },
      { key: 'course', label: 'Course', source: 'courses', show: 'code', required: true, filterBy: 'college' },
    ],
    refs: [['records', 'authors', true], ['users', 'personId']],
  },
  employees: {
    title: 'Employees', singular: 'Employee', icon: 'briefcase',
    fields: [
      { key: 'employeeNo', label: 'Employee ID', required: true, unique: true, placeholder: 'EMP-0001' },
      { key: 'name', label: 'Full name', required: true, wide: true },
      { key: 'office', label: 'Office', source: 'offices', show: 'name', required: true },
      { key: 'position', label: 'Position', placeholder: 'e.g. Security Guard' },
    ],
    refs: [['records', 'authors', true], ['users', 'personId']],
  },
  offices: {
    title: 'Offices', singular: 'Office', icon: 'home',
    fields: [
      { key: 'code', label: 'Office code', required: true, unique: true, upper: true, max: 10, placeholder: 'e.g. ACCT' },
      { key: 'name', label: 'Office name', required: true, unique: true, wide: true },
      { key: 'category', label: 'Office category', options: OFFICE_CATEGORIES, required: true },
      { key: 'college', label: 'Attached college (optional)', source: 'colleges', show: 'abbr' },
    ],
    refs: [['employees', 'office'], ['records', 'office'], ['users', 'office']],
  },
  semesters: {
    title: 'Semesters', singular: 'Semester', icon: 'calendar',
    fields: [
      { key: 'name', label: 'Semester / term', required: true, unique: true },
      { key: 'period', label: 'Typical period', placeholder: 'e.g. Aug – Dec' },
    ],
    refs: [['records', 'semester']],
  },
  academicYears: {
    title: 'Academic Years', singular: 'Academic year', icon: 'calendar',
    fields: [
      { key: 'label', label: 'Academic year', required: true, unique: true, pattern: /^(\d{4})-(\d{4})$/, patternMsg: 'Use the format YYYY-YYYY (e.g. 2026-2027) with consecutive years.', placeholder: '2026-2027' },
    ],
    refs: [['records', 'year']],
  },
  indexing: {
    title: 'Indexing Categories', singular: 'Indexing category', icon: 'book-open',
    fields: [
      { key: 'name', label: 'Index name', required: true, unique: true },
      { key: 'color', label: 'Badge color', color: true },
    ],
    refs: [['records', 'indexing']],
  },
  fundingAgencies: {
    title: 'Funding Agencies', singular: 'Funding agency', icon: 'award',
    fields: [{ key: 'name', label: 'Agency name', required: true, unique: true, wide: true }],
    refs: [['records', 'fundingAgency']],
  },
};
export const MASTER_LIST = Object.keys(MASTERS);

// ─── Roles ─────────────────────────────────────────────────────────────────────
export const ROLES = {
  admin: { label: 'Research Office Administrator', short: 'Administrator' },
  coordinator: { label: 'College Research Coordinator', short: 'Coordinator', needs: 'college' },
  faculty: { label: 'Faculty Member', short: 'Faculty', needs: 'person', people: 'faculty' },
  student: { label: 'Student Research Contributor', short: 'Student', needs: 'person', people: 'students' },
  employee: { label: 'Employee Research Contributor', short: 'Employee', needs: 'person', people: 'employees' },
  auditor: { label: 'Viewer / Auditor', short: 'Auditor' },
};

export const STATUS = {
  verified: { label: 'Verified', variant: 'success' },
  pending: { label: 'Pending review', variant: 'warning' },
  returned: { label: 'Returned', variant: 'error' },
};

// Where reviewers leave suggestions/comments on the hosted prototype (GitHub Issues; needs a free GitHub account).
export const FEEDBACK_URL = 'https://github.com/angelcms31/Research-Management-System/issues/new?title=Prototype+feedback%3A+&body=Page%2Fscreen%3A+%0A%0AWhat+I+noticed+or+suggest%3A+%0A';
