// Single source of truth for personal details, links, and resume content.
// Update values here and every page picks them up.

export const site = {
  name: 'Sām Kazemi',
  legalName: 'Mojtaba (Sām) Kazemi',
  /** Sām Kazemi in Old Persian cuneiform (sa-a-ma · ka-a-za-i-mi-i), the script of Persepolis. */
  oldPersianName: '𐎿𐎠𐎶𐏐𐎣𐎠𐏀𐎡𐎷𐎡',
  oldPersianFirst: '𐎿𐎠𐎶',
  title: 'Lead Software Engineer',
  tagline: 'Health-tech and labor-tech platforms, built for the people who rely on them.',
  location: 'San Francisco Bay Area, CA',
  email: 'mokazemi0@gmail.com',
  workEmail: 'samkazemi@workforcesystems.net',
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
  { label: 'Projects', href: '/projects' },
  { label: 'Skills', href: '/skills' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'Resume', href: '/resume' },
];

export const skills = [
  {
    group: 'Languages & Frameworks',
    icon: 'code',
    items: ['JavaScript', 'TypeScript', 'React', 'Python', 'Node.js', 'Express', 'Flask', 'HTML5 / CSS', 'SQL', 'PostgreSQL', 'Java', 'C++'],
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
    group: 'Engineering',
    icon: 'layers',
    items: [
      'Full-stack development',
      'Web development',
      'Front-end design',
      'API development',
      'Object-oriented programming',
      'Algorithms',
      'Data management',
      'Team leadership',
    ],
  },
  {
    group: 'AI-Assisted Engineering',
    icon: 'rocket',
    items: [
      'Claude Code',
      'Codex',
      'Prompt engineering',
      'AI agents',
      'AI code review & auditing',
      'Custom skills & guidelines',
    ],
  },
  {
    group: 'Spoken Languages',
    icon: 'languages',
    items: ['English', 'Persian (Farsi)'],
  },
] as const;

export const metrics = [
  { value: '200%+', label: 'Growth in recurring revenue from patient engagement systems' },
  { value: '40%', label: 'Less administrative overhead after automating infrastructure' },
  { value: '35%', label: 'Faster deployments with automated CI/CD on AWS' },
  { value: '15%', label: 'Fewer missed appointments through care coordination' },
];

type ResumeEntry = {
  name: string;
  role: string;
  location: string;
  dates: string;
  points: string[];
};

// Mirrors the downloadable PDF (public/resume/Sam-Kazemi-Resume.pdf) line for
// line;
// update this block whenever the PDF changes.
export const resume = {
  summary:
    'Health tech software engineer with hands-on experience architecting a production HIPAA-compliant CCM/RPM platform from the ground up. Specialized in React, AWS, and clinical workflow systems across multi-portal, regulated environments.',
  education: [
    {
      name: 'San Francisco State University',
      role: 'B.S. in Computer Science, Minor in Persian Studies',
      location: 'San Francisco, CA',
      dates: 'Jan 2024 – Aug 2026',
      points: ['GPA: 3.53/4.00, Honor Roll + Dean’s List'],
    },
    {
      name: 'Los Medanos College',
      role: 'Lower Division Computer Science Coursework, Transfer to SFSU',
      location: 'Pittsburg, CA',
      dates: 'Aug 2020 – Nov 2023',
      points: ['GPA: 3.43/4.00, Honor Roll'],
    },
  ],
  experience: [
    {
      name: 'MedManage Solutions',
      role: 'Lead Software Engineer',
      location: 'Daly City, CA',
      dates: 'Sep 2025 – Present',
      points: [
        'Architected and built ClearPath Virtual Health from the ground up, a production HIPAA-compliant CCM/RPM platform spanning four role-based portals with MFA, secure session management, and audit logging.',
        'Engineered React/AWS infrastructure with S3, CloudFront, ECS Fargate, CI/CD, and JWT/RBAC API integrations, reducing deployment time by 35% and administrative overhead by 40%.',
        'Built Medicare billing and patient engagement systems supporting CPT/ICD-10 workflows, physician sign-off, PDF reporting, and care coordination, contributing to 200%+ recurring revenue growth and 15% fewer missed appointments.',
      ],
    },
    {
      name: 'Optimyzi',
      role: 'Software Engineer Intern',
      location: 'San Francisco, CA',
      dates: 'Dec 2025 – Jun 2026',
      points: [
        'Helped design core modules for a full-stack healthcare platform using React, TypeScript, Node.js, Express, and PostgreSQL with shared data models and RBAC.',
        'Built clinical workflows and multi-portal architecture spanning intake, diagnosis, lab results, authentication, and secure API integrations.',
      ],
    },
  ],
  projects: [
    {
      name: 'Union Workforce Ecosystem',
      role: 'Software Developer',
      location: 'San Francisco, CA',
      dates: 'Jul 2026 – Present',
      points: [
        'Designed and prototyped a five-portal workforce platform unifying dispatch, dues, grievances, training, and benefits.',
        'Built normalized insurance data models and shared design-system tooling across 100+ screens, eliminating cross-screen inconsistencies and UI drift.',
      ],
    },
  ],
  activities: [
    {
      name: 'MESA Program at San Francisco State',
      role: 'Mentor',
      location: 'San Francisco, CA',
      dates: 'Aug 2024 – Aug 2026',
      points: ['Guided peers in academic and career development, fostering collaboration and professional growth.'],
    },
  ],
  skills: [
    { label: 'Languages & Frameworks', value: 'JavaScript, TypeScript, React, Python, Node.js, HTML5/CSS, SQL, Java, C++' },
    { label: 'Cloud & DevOps', value: 'AWS (S3, CloudFront, ECS Fargate), CI/CD, REST API Integration, System Architecture' },
    { label: 'Healthcare & Compliance', value: 'HIPAA, CCM/RPM, Medicare Billing (CPT/ICD-10), EHR Workflows, MFA, RBAC' },
    { label: 'Languages', value: 'English, Persian' },
  ],
} satisfies {
  summary: string;
  education: ResumeEntry[];
  experience: ResumeEntry[];
  projects: ResumeEntry[];
  activities: ResumeEntry[];
  skills: { label: string; value: string }[];
};

export type Review = {
  name: string;
  headline: string;
  relationship: string;
  date: string;
  /** Short line pulled from the review for the card heading. */
  highlight: string;
  paragraphs: string[];
};

// LinkedIn recommendations, quoted as written (with "Sām" spelled consistently).
export const reviews: Review[] = [
  {
    name: 'Monica Martinez',
    headline: 'Chronic Care Management Director · Former Clinic Manager · Care Coordination, Clinic Operations & Patient Engagement',
    relationship: 'Worked with Sām on the same team',
    date: 'September 29, 2026',
    highlight: 'He doesn’t just hear what you’re asking for—he takes the time to understand why you need it.',
    paragraphs: [
      'I’ve truly enjoyed working with Sām and have been impressed by not only his technical knowledge, but also the way he approaches collaboration.',
      'Working in healthcare, I often look at things from the perspective of the patient, the care team, and the day-to-day workflow. Sām has been great at listening to those perspectives, asking the right questions, and turning ideas that can sometimes be complicated into solutions that are practical and user-friendly.',
      'What I appreciate most is that he doesn’t just hear what you’re asking for—he takes the time to understand why you need it and looks for ways to make the overall experience better. He’s patient, responsive, creative, and genuinely cares about building something that will actually make a difference.',
      'It’s rare to find someone who can bring strong technical skills together with that level of openness and willingness to collaborate. I’ve really valued being able to share ideas with Sām, challenge each other’s thinking, and watch those ideas develop into something tangible.',
      'I would absolutely recommend Sām to anyone looking for an engineer who is talented, thoughtful, dependable, and genuinely invested in the people and purpose behind the technology.',
    ],
  },
  {
    name: 'Noah Atkins',
    headline: 'Senior Medical Assistant · Aspiring PA · BSPH, UC San Diego',
    relationship: 'Worked with Sām on the same team',
    date: 'August 30, 2026',
    highlight: 'Sām’s capacity to translate complex problems into elegant solutions makes him an invaluable collaborator.',
    paragraphs: [
      'Collaborating with Sām has proven to be an exceptional experience. He brings genuine intellectual prowess to everything he does, and his meticulous attention to detail consistently elevates the quality of our work.',
      'We developed ClearPath Virtual Health together, a platform designed to streamline continuity of care while keeping patients at the center of everything. Sām was instrumental in bringing this vision to life. His precision and dedication shaped every component of the project. What bound our work together was a clear understanding of the real challenges patients face: struggling to connect with providers, navigating disorganized systems, managing unexpected emergencies. That insight drove every decision we made with ClearPath. Sām’s capacity to translate complex problems into elegant solutions makes him an invaluable collaborator.',
    ],
  },
  {
    name: 'Justin Haubrich',
    headline: 'Senior Software Engineer · Founder of VaultSort',
    relationship: 'Sām’s mentor',
    date: 'June 15, 2025',
    highlight: 'He wasn’t just coding—he was solving a future problem that most people aren’t even thinking about yet.',
    paragraphs: [
      'It’s been a privilege to watch Sām Kazemi bring CyborgSecurity to life—a project that truly reflects his creativity, technical ability, and forward-thinking mindset. CyborgSecurity is a Python-based cybersecurity tool designed to secure advanced neural interface technologies like Neuralink. The concept alone shows Sām’s visionary thinking, but what really stood out to me was how deeply he thought through its design, architecture, and real-world applications. He wasn’t just coding—he was solving a future problem that most people aren’t even thinking about yet.',
      'His use of Python in the project was particularly impressive. From structuring secure protocols to implementing detection logic, everything was thoughtfully executed. What sets Sām apart, though, is his relentless work ethic. He was constantly refining the tool and improving performance. And even during breaks, he’d be shadowboxing or working out—literally training his mind and body side by side. That level of discipline and intensity is rare.',
      'Sām’s passion for technology and his commitment to excellence are evident in everything he does. CyborgSecurity is just one example of what he’s capable of when he’s inspired. I have no doubt that he’ll bring that same level of energy and innovation to any team or opportunity he’s a part of.',
    ],
  },
  {
    name: 'Jonathan Pereira',
    headline: 'Deployment Engineer @ Mytra',
    relationship: 'Studied with Sām',
    date: 'June 17, 2025',
    highlight: 'He is definitely a team worker and a pleasure to work with!',
    paragraphs: [
      'Sām always puts his best foot forward and works hard. I worked on a vehicle management system in our Programming Methodologies class. He always took initiative and helped come up with technical requirements and implementation. He is definitely a team worker and a pleasure to work with!',
    ],
  },
];
