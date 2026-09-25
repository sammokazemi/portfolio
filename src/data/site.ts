// Single source of truth for personal details, links, and resume content.
// Update values here and every page picks them up.

export const site = {
  name: 'Sām Kazemi',
  legalName: 'Mojtaba (Sām) Kazemi',
  persianName: 'سام کاظمی',
  title: 'Lead Software Engineer',
  tagline: 'Health-tech and labor-tech platforms, built for the people who rely on them.',
  location: 'San Francisco Bay Area, CA',
  email: 'mokazemi@medmanagesolutions.com',
  resumePdf: '/resume/Sam-Kazemi-Resume.pdf',
  description:
    'Sām Kazemi is a Lead Software Engineer who architected ClearPath Virtual Health, a HIPAA-compliant chronic care platform, and leads engineering at Workforce Systems.',
};

export type Social = {
  label: string;
  href: string;
  icon: 'linkedin' | 'github' | 'instagram' | 'x';
  handle: string;
  /** Placeholder entries render in the footer but are marked for replacement. */
  placeholder?: boolean;
};

export const socials: Social[] = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/mojtaba-kazemi-529264317/',
    icon: 'linkedin',
    handle: 'Mojtaba (Sām) Kazemi',
  },
  {
    label: 'GitHub',
    href: 'https://github.com/sammokazemi',
    icon: 'github',
    handle: 'sammokazemi',
  },
  // TODO: replace with real profile URLs, or delete the entries you don't use.
  { label: 'Instagram', href: '#', icon: 'instagram', handle: 'your-handle', placeholder: true },
  { label: 'X', href: '#', icon: 'x', handle: 'your-handle', placeholder: true },
];

export const nav = [
  { label: 'About', href: '/about' },
  { label: 'Experience', href: '/experience' },
  { label: 'Projects', href: '/projects' },
  { label: 'Skills', href: '/skills' },
  { label: 'Education', href: '/education' },
  { label: 'Writing', href: '/blog' },
  { label: 'Resume', href: '/resume' },
];

export type Role = {
  title: string;
  org: string;
  orgUrl?: string;
  location: string;
  start: string;
  end: string;
  summary: string;
  points: string[];
  tags: string[];
};

export const experience: Role[] = [
  {
    title: 'Lead Software Engineer',
    org: 'MedManage Solutions',
    orgUrl: 'https://clearpathvirtualhealth.com/',
    location: 'Daly City, CA',
    start: 'Sep 2025',
    end: 'Present',
    summary:
      'Leads development of ClearPath Virtual Health: architecting scalable features, improving clinical workflows, and managing a distributed engineering team.',
    points: [
      'Architected and built ClearPath Virtual Health from the ground up: a production HIPAA-compliant CCM/RPM platform across four role-based portals (Patient, VCC, Doctor, Admin) spanning 30+ components, with HIPAA-compliant session management, MFA, and audit logging.',
      'Worked across frontend and AWS infrastructure (S3, CloudFront, ECS Fargate) with automated CI/CD pipelines, reducing deployment time by 35% and administrative overhead by 40%.',
      'Owned frontend integration of secure JWT-authenticated REST APIs with RBAC, enabling Medicare billing workflows supporting CPT and ICD-10 codes.',
      'Increased recurring revenue by 200%+ and reduced missed appointments by 15% through end-to-end patient engagement and care coordination systems.',
      'Engineered a monthly CCM billing reports system with encounter documentation, CPT/ICD-10 code management, physician sign-off workflows, and PDF export, directly supporting Medicare reimbursement compliance.',
    ],
    tags: ['React', 'AWS', 'HIPAA', 'CI/CD', 'RBAC', 'Team leadership'],
  },
  {
    title: 'Lead Engineer',
    org: 'Workforce Systems (WFS)',
    orgUrl: 'https://workforcesystems.net/',
    location: 'Daly City, CA',
    start: 'Apr 2026',
    end: 'Present',
    summary:
      'Leads engineering at an early-stage startup building software for labor unions, from product design through securing contracts with union clients.',
    points: [
      'Designed and prototyped a five-portal labor workforce platform, the Union Workforce Ecosystem, unifying dispatch, dues, grievances, training, and benefits into one system of record.',
      'Built a carrier-agnostic health coverage model normalizing insurance data across 100+ screens with derived totals, eliminating cross-screen inconsistency.',
      'Established a shared design system and generator tooling to regenerate UI chrome and prevent drift across the growing screen library.',
      'Builds applications for unions and works directly with union leadership to secure contracts.',
    ],
    tags: ['Product architecture', 'Design systems', 'Node.js tooling', 'Client delivery'],
  },
  {
    title: 'Mentor',
    org: 'MESA Program at San Francisco State',
    location: 'San Francisco, CA',
    start: 'Aug 2024',
    end: 'Present',
    summary: 'Mentors students in the Mathematics, Engineering, Science Achievement program.',
    points: [
      'Guides peers in academic and career development, fostering collaboration and professional growth.',
    ],
    tags: ['Mentorship', 'Community'],
  },
];

export const skills = [
  {
    group: 'Languages & Frameworks',
    icon: 'code',
    items: ['JavaScript', 'TypeScript', 'React', 'Python', 'Node.js', 'HTML5 / CSS', 'SQL', 'Java', 'C++'],
  },
  {
    group: 'Cloud & DevOps',
    icon: 'cloud',
    items: ['AWS S3', 'AWS CloudFront', 'AWS ECS Fargate', 'CI/CD pipelines', 'REST API integration', 'System architecture'],
  },
  {
    group: 'Healthcare & Compliance',
    icon: 'shield',
    items: ['HIPAA', 'CCM / RPM', 'Medicare billing (CPT / ICD-10)', 'EHR workflows', 'MFA', 'RBAC'],
  },
  {
    group: 'Spoken Languages',
    icon: 'languages',
    items: ['English', 'Persian (فارسی)'],
  },
] as const;

export const education = [
  {
    school: 'San Francisco State University',
    location: 'San Francisco, CA',
    degree: 'B.S. in Computer Science',
    minor: 'Minor in Persian Studies',
    start: 'Jan 2024',
    end: 'Aug 2026',
    highlights: ['GPA 3.53 / 4.00', "Dean's List", 'Mentor, MESA Program (Aug 2024 – Present)'],
  },
  {
    school: 'Los Medanos College',
    location: 'Pittsburg, CA',
    degree: 'Lower-division Computer Science coursework',
    minor: 'Transferred to SFSU',
    start: 'Aug 2020',
    end: 'Nov 2023',
    highlights: ['GPA 3.43 / 4.00', 'Honor Roll'],
  },
];

export const metrics = [
  { value: '200%+', label: 'Growth in recurring revenue from patient engagement systems' },
  { value: '40%', label: 'Less administrative overhead after automating infrastructure' },
  { value: '35%', label: 'Faster deployments with automated CI/CD on AWS' },
  { value: '15%', label: 'Fewer missed appointments through care coordination' },
];
