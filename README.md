# PLM Research Management System (PLM-RMS) — working prototype

A runnable front-end prototype built from the attached flow (wireframes v2 + design brief + system documentation) and the hi-fi React design in `PLM Research Management System Initial Flow and design/`.

**Stack:** Vite + React 18, React Router (hash routing), Chart.js, `write-excel-file` (real `.xlsx` export). No backend: all data lives in the browser's `localStorage` (seeded with sample data; *Administration → System Settings → Reset demo data* restores it).

## Run

```bash
npm install
npm run dev        # http://localhost:5173
# or: npm run build && npm run preview
```

## Demo logins (also clickable on the login screen)

| Role | Email | Password |
|---|---|---|
| Research Office Administrator | admin@plm.edu.ph | Admin@123 |
| College Research Coordinator (CET) | cet.research@plm.edu.ph | Coord@123 |
| College Research Coordinator (CCSS) | ccss.research@plm.edu.ph | Coord@123 |
| Faculty (Dr. Maria Santos) | msantos@plm.edu.ph | Faculty@123 |
| Student contributor (Aira Valdez) | avaldez@plm.edu.ph | Student@123 |
| Employee contributor (Accounting Office) | mdelacruz@plm.edu.ph | Employee@123 |
| Viewer / Auditor | audit@plm.edu.ph | Audit@123 |
| Inactive account (sign-in blocked) | former.faculty@plm.edu.ph | Faculty@123 |

## Features

- **Login** – validated, inactive users blocked, idle-session timeout (configurable), forgot-password request, role-scoped navigation, route guards (unauthorized → dashboard + message; unknown → 404).
- **Dashboard** – tiles, bar/line/donut charts, funding & indexing indicators, recent activity (from audit log); everything computed live and filtered by year / semester / college; role-scoped.
- **Five record modules** – Faculty Research, Employee Research (classified by **Office**), Presented Papers, Published Journals (full-page sectioned form), Student Research. Search, filters, sort, pagination, row actions, new-row highlight, detail page (authors' other outputs, audit metadata, history), delete confirmation, Excel/PDF export.
  Computed author counts, conditional funding agency, master-data dropdowns only, ISSN/DOI/year/date validation, duplicate-title check, course-must-belong-to-college.
- **Review workflow** – contributor submissions are *Pending*; coordinators/admin *Verify* or *Return with reason*; notifications bell; optional "official figures only" setting.
- **Reports & Analytics** – R-01…R-11 (per college, college listing, per faculty, per student, per office, per employee, indexing, semester, yearly trend) + working **Custom Report Builder**; Excel (.xlsx) and PDF (print → Save as PDF) with seal, filters, generated-by and date.
- **Repository Search** – keyword (all terms), facets (type, college, year, semester, author, index), sorting, results grouped by type, browse-by counts, URL-shareable.
- **Maintenance** – CRUD for colleges, courses, faculty, students, employees, offices, semesters, academic years, indexing categories, funding agencies; duplicate prevention; in-use entries cannot be deleted (deactivate instead).
- **Administration** – user CRUD with roles, activate/deactivate, admin password reset; read-only filterable audit log (create/update/delete/login/logout/export/verify/return); system settings.
- **Responsive** – sidebar becomes an off-canvas menu under 900 px; tables scroll inside cards; drawers/modals fit small screens.

## Assumptions & deviations (please review)

1. **Record types:** the wireframes v2 define five types (incl. Employee Research by Office); I built those five. The documentation's *Student Presented Papers* and *Employee Presented Papers* modules are **not** built (marked "by analogy / confirm" in the docs).
2. **Roles:** six roles from the documentation (brief lists four; Student and Employee contributors added). Contributors see/edit only records they author; faculty read everything but edit only their own.
3. **Maintenance / Administration** appear as single sidebar items (as in the hi-fi design) with tabs for each entity/section, instead of separate sidebar entries per entity.
4. **"Year"** on records is the *academic year* (as in the design); journals also keep *Year published*. Presented-paper event date is validated as a date.
5. **Employees without a college:** their research counts under "Offices (non-teaching)" in college-based charts/reports; offices may optionally be attached to a college (needed for coordinator scoping).
6. **Funding agency** is a master-data dropdown (docs) rather than the free text in the design mock.
7. **PDF export** uses the browser print dialog ("Save as PDF") rather than generating a PDF file; Excel export is a real `.xlsx`.
8. **File attachments** (documentation §13, flagged there as optional) are not implemented.
9. **Security:** passwords are plain text in localStorage — acceptable for a no-backend prototype only.
10. The design's hard-coded dashboard numbers and fake export/"coming soon" screens were replaced with live, working equivalents.

## Verification done

Driven in Chrome: sign-in for each role, role-scoped navigation and route guards, record add (validation + success + highlight), journal full-page form, verify/return workflow, maintenance duplicate/in-use rules, user creation and sign-in checks, Excel export download, and layout at 375 px (no horizontal overflow, off-canvas menu). **Not exercised:** the PDF print dialog and the idle-timeout sign-out (code paths exist).
