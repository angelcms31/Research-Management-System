// Realistic sample data for the prototype. Rebuilt by "Reset demo data" in Administration → Settings.
import { TYPES } from './schema.js';

const a = (arr) => arr.map((x) => ({ ...x, active: true }));

export const SEED_VERSION = 3;

export function makeSeed() {
  const now = Date.now();
  const hoursAgo = (h) => new Date(now - h * 3600e3).toISOString();

  const colleges = a([
    { id: 'cet', abbr: 'CET', name: 'College of Engineering and Technology' },
    { id: 'cs', abbr: 'CS', name: 'College of Science' },
    { id: 'cal', abbr: 'CAL', name: 'College of Arts and Letters' },
    { id: 'cba', abbr: 'CBA', name: 'College of Business and Accountancy' },
    { id: 'ccss', abbr: 'CCSS', name: 'College of Computer Studies and Systems' },
    { id: 'coed', abbr: 'COED', name: 'College of Education' },
    { id: 'cl', abbr: 'CL', name: 'College of Law' },
    { id: 'cnhs', abbr: 'CNHS', name: 'College of Nursing and Health Sciences' },
    { id: 'cpers', abbr: 'CPERS', name: 'College of Physical Education, Recreation and Sports' },
    { id: 'gs', abbr: 'GS', name: 'Graduate School' },
  ]);
  const courses = a([
    { id: 'bscs', code: 'BSCS', name: 'BS Computer Science', college: 'ccss' },
    { id: 'bsit', code: 'BSIT', name: 'BS Information Technology', college: 'ccss' },
    { id: 'bsee', code: 'BSEE', name: 'BS Electrical Engineering', college: 'cet' },
    { id: 'bsce', code: 'BSCE', name: 'BS Civil Engineering', college: 'cet' },
    { id: 'bsbio', code: 'BSBIO', name: 'BS Biology', college: 'cs' },
    { id: 'bschem', code: 'BSCHEM', name: 'BS Chemistry', college: 'cs' },
    { id: 'abcom', code: 'ABCOM', name: 'AB Communication', college: 'cal' },
    { id: 'bsa', code: 'BSA', name: 'BS Accountancy', college: 'cba' },
    { id: 'bsba', code: 'BSBA', name: 'BS Business Administration', college: 'cba' },
    { id: 'bsed', code: 'BSED', name: 'BS Education', college: 'coed' },
    { id: 'bsn', code: 'BSN', name: 'BS Nursing', college: 'cnhs' },
    { id: 'bspe', code: 'BSPE', name: 'BS Physical Education', college: 'cpers' },
  ]);
  const offices = a([
    { id: 'acct', code: 'ACCT', name: 'Accounting Office', category: 'Administrative', college: null },
    { id: 'reg', code: 'REG', name: "Registrar's Office", category: 'Administrative', college: null },
    { id: 'hr', code: 'HR', name: 'Human Resources Office', category: 'Administrative', college: null },
    { id: 'lib', code: 'LIB', name: 'University Library', category: 'Academic Support', college: null },
    { id: 'ro', code: 'RO', name: 'Research Office', category: 'Academic Support', college: null },
    { id: 'maint', code: 'MAINT', name: 'Buildings and Grounds', category: 'Maintenance', college: null },
    { id: 'sec', code: 'SEC', name: 'Security Office', category: 'Security', college: null },
    { id: 'cetd', code: 'CETD', name: "CET Dean's Office", category: 'Administrative', college: 'cet' },
  ]);
  const faculty = a([
    { id: 'f1', name: 'Dr. Maria Santos', college: 'cet', rank: 'Professor' },
    { id: 'f2', name: 'Dr. Jose Reyes', college: 'cs', rank: 'Professor' },
    { id: 'f3', name: 'Prof. Ana Garcia', college: 'cal', rank: 'Associate Professor' },
    { id: 'f4', name: 'Dr. Roberto Cruz', college: 'cba', rank: 'Professor' },
    { id: 'f5', name: 'Dr. Michael Lim', college: 'ccss', rank: 'Associate Professor' },
    { id: 'f6', name: 'Dr. Patricia Dela Cruz', college: 'coed', rank: 'Professor' },
    { id: 'f7', name: 'Atty. Ramon Flores', college: 'cl', rank: 'Assistant Professor' },
    { id: 'f8', name: 'Dr. Elena Bautista', college: 'cnhs', rank: 'Professor' },
    { id: 'f9', name: 'Dr. Juan Mendoza', college: 'cet', rank: 'Associate Professor' },
    { id: 'f10', name: 'Dr. Liza Villanueva', college: 'cs', rank: 'Associate Professor' },
    { id: 'f11', name: 'Prof. Carlos Ramos', college: 'ccss', rank: 'Assistant Professor' },
    { id: 'f12', name: 'Dr. Sunshine Tan', college: 'gs', rank: 'Professor' },
    { id: 'f13', name: 'Dr. Benito Aguilar', college: 'cnhs', rank: 'Associate Professor' },
    { id: 'f14', name: 'Prof. Diana Navarro', college: 'cba', rank: 'Assistant Professor' },
    { id: 'f15', name: 'Dr. Rosario Pineda', college: 'cpers', rank: 'Associate Professor' },
    { id: 'f16', name: 'Prof. Gabriel Santiago', college: 'cal', rank: 'Assistant Professor' },
  ]);
  const S = (id, name, college, course) => ({ id, studentNo: `2021-${String(100 + +id.slice(1)).padStart(5, '0')}`, name, college, course });
  const students = a([
    S('s1', 'Aira Valdez', 'ccss', 'bscs'), S('s2', 'Renz Aquino', 'ccss', 'bscs'), S('s3', 'Kyle Soriano', 'ccss', 'bscs'),
    S('s4', 'Marie Pascual', 'coed', 'bsed'), S('s5', 'Kristine Aguilar', 'coed', 'bsed'),
    S('s6', 'Jose Alvarado', 'cal', 'abcom'), S('s7', 'Nina Cruz', 'cal', 'abcom'), S('s8', 'Mark Ocampo', 'cal', 'abcom'), S('s9', 'Sarah Gomez', 'cal', 'abcom'),
    S('s10', 'Andrei Reyes', 'cet', 'bsee'), S('s11', 'Paolo Santos', 'cet', 'bsee'),
    S('s12', 'Diana Lopez', 'cba', 'bsa'), S('s13', 'Iris Navarro', 'cba', 'bsa'), S('s14', 'Roy Catalan', 'cba', 'bsa'),
    S('s15', 'Faith Santos', 'cs', 'bsbio'), S('s16', 'Marco Reyes', 'cs', 'bsbio'),
    S('s17', 'Hannah Villareal', 'cnhs', 'bsn'), S('s18', 'Lance Dizon', 'cnhs', 'bsn'),
    S('s19', 'Bea Fernandez', 'cpers', 'bspe'), S('s20', 'Carlo Mendoza', 'cet', 'bsce'),
    S('s21', 'Trisha Manalo', 'ccss', 'bsit'), S('s22', 'Gian Roque', 'cs', 'bschem'),
  ]);
  const E = (n, name, office, position) => ({ id: `e${n}`, employeeNo: `EMP-${String(n).padStart(4, '0')}`, name, office, position });
  const employees = a([
    E(1, 'Ms. Marites Dela Cruz', 'acct', 'Accountant III'), E(2, 'Mr. Eduardo Santos', 'sec', 'Security Supervisor'),
    E(3, 'Ms. Lourdes Bernardo', 'reg', 'Registrar Staff'), E(4, 'Mr. Ramil Pascual', 'maint', 'Maintenance Foreman'),
    E(5, 'Ms. Grace Ocampo', 'lib', 'Librarian II'), E(6, 'Mr. Dennis Villamor', 'hr', 'HR Officer'),
    E(7, 'Ms. Rhea Tolentino', 'ro', 'Research Assistant'), E(8, 'Mr. Arnel Castillo', 'sec', 'Security Guard'),
    E(9, 'Ms. Josefa Rivera', 'cetd', 'Administrative Aide'), E(10, 'Mr. Noel Garcia', 'maint', 'Utility Worker'),
  ]);
  const semesters = a([
    { id: 'sem1', name: '1st Semester', period: 'Aug – Dec' },
    { id: 'sem2', name: '2nd Semester', period: 'Jan – May' },
    { id: 'sem3', name: 'Summer', period: 'Jun – Jul' },
  ]);
  const academicYears = a(['2021-2022', '2022-2023', '2023-2024', '2024-2025', '2025-2026', '2026-2027'].map((l) => ({ id: l, label: l })));
  const indexing = a([
    { id: 'scopus', name: 'Scopus', color: '#C8A12A' },
    { id: 'wos', name: 'Web of Science', color: '#1F3A93' },
    { id: 'ched', name: 'CHED', color: '#2E7D4F' },
    { id: 'others', name: 'Others', color: '#5C6B7A' },
  ]);
  const fundingAgencies = a([
    { id: 'fa-plm', name: 'PLM Research Office' }, { id: 'fa-dost', name: 'DOST-PCIEERD' },
    { id: 'fa-chedzrc', name: 'CHED-ZRC' }, { id: 'fa-chedphedf', name: 'CHED-PHEDF' },
    { id: 'fa-doe', name: 'DOE Philippines' }, { id: 'fa-doh', name: 'DOH Philippines' },
    { id: 'fa-dostpchrd', name: 'DOST-PCHRD' },
  ]);

  const users = [
    { id: 'u-admin', name: 'Research Office Admin', email: 'admin@plm.edu.ph', password: 'Admin@123', role: 'admin', status: 'active' },
    { id: 'u-cet', name: 'CET Research Coordinator', email: 'cet.research@plm.edu.ph', password: 'Coord@123', role: 'coordinator', college: 'cet', status: 'active' },
    { id: 'u-ccss', name: 'CCSS Research Coordinator', email: 'ccss.research@plm.edu.ph', password: 'Coord@123', role: 'coordinator', college: 'ccss', status: 'active' },
    { id: 'u-faculty', name: 'Dr. Maria Santos', email: 'msantos@plm.edu.ph', password: 'Faculty@123', role: 'faculty', personId: 'f1', status: 'active' },
    { id: 'u-student', name: 'Aira Valdez', email: 'avaldez@plm.edu.ph', password: 'Student@123', role: 'student', personId: 's1', status: 'active' },
    { id: 'u-employee', name: 'Ms. Marites Dela Cruz', email: 'mdelacruz@plm.edu.ph', password: 'Employee@123', role: 'employee', personId: 'e1', status: 'active' },
    { id: 'u-audit', name: 'Auditor Account', email: 'audit@plm.edu.ph', password: 'Audit@123', role: 'auditor', status: 'active' },
    { id: 'u-former', name: 'Dr. Former Faculty', email: 'former.faculty@plm.edu.ph', password: 'Faculty@123', role: 'faculty', personId: 'f16', status: 'inactive' },
  ].map((u) => ({ college: null, personId: null, lastLogin: null, ...u }));

  // ── Research records ────────────────────────────────────────────────────────
  // [title, authors, academicYear, semester, fundingAgency|null, extras]
  const FR = [
    ['Water Quality Assessment of the Pasig River Tributaries in Manila', ['f2', 'f10'], '2021-2022', 'sem1', null],
    ['Employee Engagement and Productivity in Philippine Local Government Units', ['f4'], '2021-2022', 'sem2', null],
    ['Teacher Readiness for Blended Learning in Manila Public Schools', ['f6'], '2021-2022', 'sem2', 'fa-plm'],
    ['Community-Based Disaster Risk Reduction Practices in Urban Poor Areas', ['f1'], '2022-2023', 'sem1', 'fa-dost'],
    ['Representation of Filipino Identity in Contemporary Television Dramas', ['f3', 'f16'], '2022-2023', 'sem2', null],
    ['Nurse Staffing Levels and Patient Outcomes in Metro Manila Hospitals', ['f8'], '2022-2023', 'sem1', 'fa-doh'],
    ['Drone-Assisted Structural Inspection of Heritage Buildings in Intramuros', ['f9', 'f1'], '2022-2023', 'sem2', 'fa-plm'],
    ['Impact of COVID-19 on Small and Medium Enterprises in Manila', ['f4'], '2023-2024', 'sem2', null],
    ['Semantic Analysis of Indigenous Filipino Literature in Contemporary Context', ['f3'], '2023-2024', 'sem1', null],
    ['Physical Fitness Levels of Senior High School Students After Remote Learning', ['f15'], '2023-2024', 'sem1', null],
    ['Bioactive Compounds in Philippine Seaweed Extracts for Wound Healing', ['f2', 'f10'], '2023-2024', 'sem2', 'fa-chedzrc'],
    ['Development of AI-Based Flood Prediction System for Metro Manila', ['f1', 'f9'], '2024-2025', 'sem1', 'fa-dost'],
    ['Machine Learning Applications in Philippine K-12 Assessment', ['f5', 'f11'], '2024-2025', 'sem1', null],
    ['Phytochemical Properties of Selected Philippine Medicinal Herbs', ['f2', 'f10'], '2024-2025', 'sem1', 'fa-chedzrc'],
    ['Effectiveness of Problem-Based Learning in Nursing Education', ['f8', 'f13'], '2024-2025', 'sem1', null],
    ['Renewable Energy Integration in Urban Philippine Communities', ['f1', 'f9'], '2024-2025', 'sem2', 'fa-doe'],
    ['Legal Framework for AI Regulation in the Philippines', ['f7'], '2024-2025', 'sem1', null],
    ['Mental Health Outcomes of Urban Youth in Post-Pandemic Manila', ['f8'], '2024-2025', 'sem2', 'fa-doh'],
    ['Smart Waste Management Systems for Philippine Local Government Units', ['f9'], '2024-2025', 'sem1', null],
    ['Large Language Models for Filipino Legal Document Summarization', ['f5', 'f7'], '2025-2026', 'sem1', 'fa-plm'],
    ['Microplastic Contamination in Manila Bay Sediments', ['f2'], '2025-2026', 'sem1', 'fa-dost'],
    ['Digital Payment Adoption Among Public Market Vendors in Manila', ['f14', 'f4'], '2025-2026', 'sem1', null, { hours: 30 }],
    ['Solar-Powered Microgrid Design for Barangay Evacuation Centers', ['f1', 'f9'], '2025-2026', 'sem1', 'fa-doe', { status: 'pending', hours: 2 }],
    ['Flood Early-Warning Sensor Network Calibration for the Marikina River Basin', ['f1', 'f9'], '2025-2026', 'sem2', null,
      { status: 'returned', returnReason: 'Please confirm whether this study received DOST support before resubmitting.', hours: 100 }],
  ];
  const ER = [
    ['Digital Records Management Practices in the University Accounting Office', ['e1'], 'acct', '2024-2025', 'sem1', null],
    ['Campus Security Incident Reporting: Gaps and Improvements', ['e2', 'e8'], 'sec', '2024-2025', 'sem1', null],
    ['Workload and Work-Life Balance Among Registrar Staff', ['e3'], 'reg', '2023-2024', 'sem2', null],
    ['Waste Segregation Compliance in PLM Buildings and Grounds', ['e4', 'e10'], 'maint', '2024-2025', 'sem2', 'fa-plm'],
    ['Library Services Satisfaction Survey Among Faculty and Students', ['e5'], 'lib', '2025-2026', 'sem1', null],
    ['Research Support Needs of Junior Faculty: A Needs Assessment', ['e7', 'e6'], 'ro', '2025-2026', 'sem1', 'fa-plm'],
    ['Telework Adoption in University Administrative Offices', ['e6'], 'hr', '2022-2023', 'sem2', null],
    ['Energy Use Behavior of Non-Teaching Personnel in the Engineering Building', ['e9'], 'cetd', '2025-2026', 'sem1', null],
    ['Accounting Controls for Research Grant Disbursement', ['e1', 'e7'], 'acct', '2025-2026', 'sem1', 'fa-dost', { status: 'pending', hours: 5 }],
  ];
  const PP = [
    ['Towards a Smart Water Management System for Philippine Urban Areas', ['f1'], '2024-2025', 'sem1', 'fa-plm', 'International Conference on Information Technology and Engineering Innovation Systems (ICTEIS)', 'Manila, Philippines', '2024-11-15'],
    ['Natural Language Processing for Filipino Code-Switched Text', ['f5'], '2024-2025', 'sem1', 'fa-chedphedf', 'ACL 2024: Annual Meeting of the Association for Computational Linguistics', 'Bangkok, Thailand', '2024-08-11'],
    ['The Legal Status of Digital Assets Under Philippine Property Law', ['f7'], '2024-2025', 'sem1', null, 'Asia Law and Society Annual Conference', 'Singapore', '2024-09-25'],
    ['Effectiveness of High-Intensity Interval Training on Metabolic Syndrome Risk Reduction', ['f15'], '2024-2025', 'sem1', null, 'ASEAN Sports Science Conference', 'Kuala Lumpur, Malaysia', '2024-10-05'],
    ['Digital Literacy Interventions for Senior Citizens in Urban Communities', ['f6'], '2023-2024', 'sem2', null, 'International Conference on ICT for Education', 'Cebu City, Philippines', '2024-03-12'],
    ['Bacteriostatic Properties of Lagundi (Vitex negundo) Against Clinical Isolates', ['f2'], '2024-2025', 'sem1', null, '13th National Convention on Statistics', 'Pasig City, Philippines', '2024-10-01'],
    ['Sentiment Analysis of Tagalog Tweets During Typhoon Events', ['f11'], '2022-2023', 'sem2', null, 'Philippine Computing Science Congress', 'Davao City, Philippines', '2023-03-23'],
    ['Adaptive Reuse of Heritage Structures for Public Libraries', ['f9'], '2023-2024', 'sem1', 'fa-plm', 'International Conference on Heritage and Built Environment', 'Kyoto, Japan', '2023-11-08'],
    ['Financial Inclusion Through Mobile Wallets: Evidence from Manila', ['f14'], '2024-2025', 'sem2', null, 'Asian Finance Association Conference', 'Seoul, South Korea', '2025-02-27'],
    ["Teachers' Experiences with AI Writing Assistants", ['f6'], '2025-2026', 'sem1', 'fa-chedphedf', 'Asia-Pacific Conference on Education', 'Hanoi, Vietnam', '2025-09-18'],
    ['Hospital Readiness for Heat-Related Illnesses', ['f8'], '2025-2026', 'sem1', 'fa-doh', 'ASEAN Public Health Forum', 'Jakarta, Indonesia', '2025-10-02', { hours: 52 }],
    ['Biosurveillance of Antimicrobial Resistance in Urban Waterways', ['f10'], '2025-2026', 'sem1', null, 'National Science and Technology Week Symposium', 'Quezon City, Philippines', '2025-11-21'],
    ['Early-Stage Detection of Mango Leaf Disease Using Edge Devices', ['f5', 'f11'], '2025-2026', 'sem2', 'fa-plm', 'IEEE Region 10 Symposium', 'Bangkok, Thailand', '2026-03-14'],
  ];
  const PJ = [
    ['Convolutional Neural Networks for Real-Time Flood Level Estimation in Philippine River Systems', ['f1', 'f9'], '2024-2025', 'sem1', 'Applied Sciences', '2076-3417', '14', 2024, '10.3390/app14010001', 'scopus'],
    ['Adaptive Learning System Using Collaborative Filtering for Philippine Higher Education', ['f5', 'f11'], '2024-2025', 'sem1', 'Computers & Education', '0360-1315', '198', 2024, '10.1016/j.compedu.2024.104978', 'scopus'],
    ['Anti-Inflammatory Properties of Vitex negundo Extracts Against LPS-Induced Inflammation', ['f2', 'f10'], '2023-2024', 'sem2', 'Journal of Ethnopharmacology', '0378-8741', '321', 2024, '10.1016/j.jep.2023.117456', 'wos'],
    ['Factors Affecting Research Productivity Among Filipino Faculty in Urban Universities', ['f12'], '2024-2025', 'sem1', 'Asia Pacific Education Review', '1598-1037', '25', 2024, '10.1007/s12564-024-09888-x', 'scopus'],
    ['Resilience Strategies of MSMEs in Post-Pandemic Philippines: A Grounded Theory Approach', ['f4', 'f14'], '2023-2024', 'sem2', 'Journal of Entrepreneurship in Emerging Economies', '2053-4604', '16', 2024, '10.1108/JEEE-07-2023-0189', 'scopus'],
    ["Nurses' Burnout and Turnover Intention During COVID-19: A Philippine Hospital Study", ['f8'], '2024-2025', 'sem1', 'Journal of Nursing Management', '0966-0429', '32', 2024, '10.1111/jonm.13956', 'wos'],
    ['Mother Tongue-Based Multilingual Education: Outcomes in Early Grades in Luzon', ['f6'], '2023-2024', 'sem2', 'International Journal of Bilingual Education and Bilingualism', '1367-0050', '27', 2024, '10.1080/13670050.2024.2290345', 'ched'],
    ['Decolonization Narratives in 21st-Century Filipino Graphic Novels', ['f3'], '2024-2025', 'sem1', 'Philippine Journal of Linguistics', '0048-3796', '54', 2024, '10.55944/pjl.54.2024.01', 'others'],
    ['Antioxidant Activity of Philippine Seaweed Extracts', ['f2', 'f10'], '2024-2025', 'sem2', 'Marine Drugs', '1660-3397', '22', 2025, '10.3390/md22010045', 'scopus'],
    ['UAV Photogrammetry for Condition Assessment of Heritage Structures', ['f1', 'f9'], '2024-2025', 'sem2', 'Journal of Cultural Heritage', '1296-2074', '65', 2025, '10.1016/j.culher.2024.11.003', 'wos'],
    ['Code-Switching Detection in Filipino Social Media Text', ['f5'], '2025-2026', 'sem1', 'Language Resources and Evaluation', '1574-020X', '59', 2025, '10.1007/s10579-025-09801-2', 'scopus'],
    ['Interprofessional Simulation Training in Philippine Nursing Schools', ['f8', 'f13'], '2025-2026', 'sem1', 'Nurse Education Today', '0260-6917', '147', 2025, '10.1016/j.nedt.2025.106301', 'scopus', { hours: 75 }],
    ['Digital Entrepreneurship Among Filipino Youth', ['f4'], '2022-2023', 'sem1', 'Philippine Management Review', '0117-3783', '30', 2022, '', 'ched'],
    ['Regulating Algorithmic Decision-Making: A Philippine Perspective', ['f7'], '2023-2024', 'sem1', 'Ateneo Law Journal', '0117-2318', '68', 2023, '', 'others'],
    ['Exercise Adherence Among Urban Adults: A Scoping Review', ['f15'], '2023-2024', 'sem2', 'Asian Journal of Sports Medicine', '2008-000X', '14', 2023, '10.5812/asjsm-132217', 'others'],
  ];
  const SR = [
    ['Automated Plant Disease Detection Using Convolutional Neural Networks', ['s1', 's2', 's3'], '2024-2025', 'sem1'],
    ['Effectiveness of Peer Tutoring on Mathematics Performance of Grade 7 Students', ['s4', 's5'], '2024-2025', 'sem1'],
    ['Effects of Social Media Usage on Academic Motivation Among PLM Freshmen', ['s6', 's7', 's8', 's9'], '2024-2025', 'sem1'],
    ['Cost-Benefit Analysis of Solar Panel Installation in PLM Campus Facilities', ['s10', 's11'], '2023-2024', 'sem2'],
    ['Financial Literacy Among Senior High School Students in Manila Public Schools', ['s12', 's13', 's14'], '2024-2025', 'sem1'],
    ['Antimicrobial Activity of Coconut Shell Biochar Extract on Selected Pathogens', ['s15', 's16'], '2024-2025', 'sem1'],
    ["Nurses' Perceptions of Telehealth Among Barangay Health Workers", ['s17', 's18'], '2025-2026', 'sem1'],
    ['Chatbot-Based Enrollment Assistant for PLM Students', ['s1', 's21'], '2025-2026', 'sem1', { status: 'pending', hours: 27 }],
    ['Lifestyle Factors and Cardiorespiratory Fitness of PLM Student-Athletes', ['s19'], '2025-2026', 'sem1'],
    ['Structural Health Monitoring of Pedestrian Footbridges Using Low-Cost Sensors', ['s20', 's10'], '2025-2026', 'sem1'],
    ['Rapid Detection of Heavy Metals in Tap Water Using Colorimetric Assays', ['s22'], '2022-2023', 'sem2'],
    ['Parasocial Relationships and Brand Loyalty Among Gen Z Consumers', ['s14'], '2022-2023', 'sem1'],
    ['Language Attitudes Toward Filipino Among Senior High School Students', ['s6', 's7'], '2021-2022', 'sem2'],
    ['Smart Parking Management Prototype for PLM Campus', ['s2', 's21'], '2023-2024', 'sem1'],
  ];

  const dateFor = (ay, sem, n) => {
    const [y1, y2] = ay.split('-').map(Number);
    const d = sem === 'sem1' ? new Date(Date.UTC(y1, 8 + (n % 3), 3 + ((n * 5) % 22), 9))
      : sem === 'sem2' ? new Date(Date.UTC(y2, 1 + (n % 3), 3 + ((n * 5) % 22), 9))
        : new Date(Date.UTC(y2, 5, 10 + (n % 10), 9));
    return d.toISOString();
  };
  const personCollege = (list, id) => list.find((p) => p.id === id);
  const creatorOf = (lead, college) => (lead === 'f1' ? 'u-faculty' : lead === 's1' ? 'u-student' : lead === 'e1' ? 'u-employee'
    : college === 'cet' && lead === 'f9' ? 'u-cet' : college === 'ccss' ? 'u-ccss' : 'u-admin');

  const counters = {};
  const records = [];
  const push = (type, o, n, extras = {}) => {
    const t = TYPES[type];
    counters[type] = (counters[type] || 0) + 1;
    const people = { faculty, students, employees }[t.people];
    const lead = personCollege(people, o.authors[0]);
    const college = o.college !== undefined ? o.college : lead.college;
    const createdBy = creatorOf(o.authors[0], college);
    const createdAt = extras.hours ? hoursAgo(extras.hours) : dateFor(o.year, o.semester, n);
    records.push({
      id: `${t.prefix}-${String(counters[type]).padStart(4, '0')}`, type, title: o.title, authors: o.authors,
      college: t.unit === 'office' ? null : college, office: t.unit === 'office' ? o.office : null,
      course: o.course || null, year: o.year, semester: o.semester,
      funded: !!o.fundingAgency, fundingAgency: o.fundingAgency || null,
      event: o.event || '', venue: o.venue || '', eventDate: o.eventDate || '',
      journal: o.journal || '', issn: o.issn || '', volume: o.volume || '', yearPublished: o.yearPublished || null,
      doi: o.doi || '', indexing: o.indexing || null,
      status: extras.status || 'verified', returnReason: extras.returnReason || '',
      createdAt, createdBy, updatedAt: createdAt, updatedBy: createdBy,
    });
  };
  FR.forEach((r, i) => push('faculty-research', { title: r[0], authors: r[1], year: r[2], semester: r[3], fundingAgency: r[4] }, i, r[5]));
  ER.forEach((r, i) => push('employee-research', { title: r[0], authors: r[1], office: r[2], year: r[3], semester: r[4], fundingAgency: r[5] }, i, r[6]));
  PP.forEach((r, i) => push('presented-papers', { title: r[0], authors: r[1], year: r[2], semester: r[3], fundingAgency: r[4], event: r[5], venue: r[6], eventDate: r[7] }, i, r[8]));
  PJ.forEach((r, i) => push('published-journals', { title: r[0], authors: r[1], year: r[2], semester: r[3], journal: r[4], issn: r[5], volume: r[6], yearPublished: r[7], doi: r[8], indexing: r[9] }, i, r[10]));
  SR.forEach((r, i) => {
    const lead = students.find((s) => s.id === r[1][0]);
    push('student-research', { title: r[0], authors: r[1], year: r[2], semester: r[3], course: lead.course }, i, r[4]);
  });

  // ── Audit log: a create entry per record + a handful of edits and sign-ins ──
  const collegeOf = (r) => r.college || offices.find((o) => o.id === r.office)?.college || null;
  const audit = [];
  let n = 0;
  const userName = (id) => users.find((u) => u.id === id)?.name || id;
  const roleOf = (id) => users.find((u) => u.id === id)?.role || 'admin';
  records.forEach((r, i) => {
    audit.push({ id: `a${++n}`, ts: r.createdAt, userId: r.createdBy, userName: userName(r.createdBy), role: roleOf(r.createdBy), action: 'create',
      module: TYPES[r.type].label, recordId: r.id, recordTitle: r.title, summary: 'Record created', college: collegeOf(r) });
    if (i % 6 === 0 && r.status === 'verified' && !r.createdAt.startsWith('2026')) {
      const ts = new Date(new Date(r.createdAt).getTime() + 2 * 86400e3).toISOString();
      audit.push({ id: `a${++n}`, ts, userId: 'u-admin', userName: userName('u-admin'), role: 'admin', action: 'update',
        module: TYPES[r.type].label, recordId: r.id, recordTitle: r.title, summary: 'Updated: title, semester', college: collegeOf(r) });
      r.updatedAt = ts; r.updatedBy = 'u-admin';
    }
  });
  users.filter((u) => u.status === 'active').forEach((u, i) => {
    const ts = hoursAgo(1 + i * 6);
    audit.push({ id: `a${++n}`, ts, userId: u.id, userName: u.name, role: u.role, action: 'login', module: 'Authentication', recordId: null, recordTitle: '', summary: 'Signed in', college: u.college });
    u.lastLogin = ts;
  });
  audit.sort((x, y) => (x.ts < y.ts ? 1 : -1));

  return {
    version: SEED_VERSION,
    colleges, courses, offices, faculty, students, employees, semesters, academicYears, indexing, fundingAgencies,
    users, records, audit,
    settings: { activeYear: '2025-2026', defaultSemester: 'sem1', idleMinutes: 30, verifiedOnly: false },
  };
}
