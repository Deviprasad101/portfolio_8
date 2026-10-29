// All portfolio content extracted from Devi_Prasad_Full_Stack_Developer_Resume.pdf

export const DATA = {
  fullName: 'Devi Prasad Chinthamreddy',
  firstName: 'Devi Prasad',
  lastName: 'Chinthamreddy',
  initials: 'DP',
  role: 'Full Stack Developer',
  field: 'CSE (AI & ML)',
  year: 2026,

  email: 'cdpreddyap@gmail.com',
  phone: '+91 6281604440',
  github: 'https://github.com/deviprasad101',
  githubHandle: 'deviprasad101',
  linkedin: 'https://www.linkedin.com/in/deviprasad-reddy-chinthamreddy-759b2326b',
  portfolioUrl: 'https://deviprasad-portfolio.vercel.app/',
  location: 'Tirupati, Andhra Pradesh, India',
  fullAddress: 'Arlapadu, Pellakuru, Tirupati, Andhra Pradesh',
  nativeLanguage: 'Telugu',

  // Preloader greetings: Hello, native-language greeting (Telugu), Namaste in Devanagari, Hola, Bonjour, Ciao, Konnichiwa in Japanese, Hi
  preloaderGreetings: [
    'Hello',
    'నమస్కారం',
    'नमस्ते',
    'Hola',
    'Bonjour',
    'Ciao',
    'こんにちは',
    'Hi',
  ],

  // Hero wave speech bubbles
  heroBubbles: [
    "Hi, I'm Devi Prasad!",
    'Hi there!',
    'Hello!',
    'Namaste!',
    'Hey, welcome!',
    'Hi again!',
  ],

  summary:
    'Full Stack Developer with professional experience building and supporting web applications using Python, FastAPI, Flask, REST APIs, PostgreSQL, JavaScript and React.js. Hands-on experience with Git/GitHub, Docker, deployment, testing, debugging and application optimization. Interested in applying these foundations to DevOps, cloud engineering and Site Reliability Engineering, with a strong problem-solving and collaboration mindset.',

  heroSummary:
    'Building full-stack web applications and geospatial platforms with Python, FastAPI, Flask, React.js, PostgreSQL, and Docker.',

  heroSideNotes: {
    left: {
      mono: 'Portfolio — 2026',
      main: 'Full Stack Developer',
      italic: 'crafting products that move.',
    },
    right: {
      mono: 'Currently',
      main: 'Full Stack Developer',
      italic: 'IIT Tirupati I-Hub (IITTNiF)',
    },
  },

  aboutChapters: [
    {
      label: '01 — Hello',
      line1: "Hi, I'm",
      line2: 'Devi Prasad',
      pill: 'Full Stack Developer',
      sentence:
        'Full Stack Developer building and supporting web applications from Tirupati, Andhra Pradesh.',
    },
    {
      label: '02 — Builder',
      line1: 'I build',
      line2: 'the whole stack',
      pill: 'Python · FastAPI · React · PostgreSQL',
      sentence:
        'Shipping responsive interfaces, REST APIs, PostgreSQL databases, and Dockerized deployments.',
    },
    {
      label: '03 — Student',
      line1: 'I study',
      line2: 'CSE · AI & ML',
      pill: 'Class of 2025',
      sentence:
        'B.Tech graduate in Computer Science (AI & ML) from Malla Reddy Engineering College, Hyderabad.',
    },
    {
      label: '04 — Solver',
      line1: 'I solve',
      line2: 'problems daily',
      pill: 'DevOps · Cloud · SRE Focus',
      sentence:
        'Applying debugging, testing, and optimization foundations to cloud engineering and reliability.',
    },
  ],

  // Quantifiable achievements from resume (coding-platform counts were not present in resume.pdf)
  numbersTokens: [
    { type: 'text', text: "I've spent" },
    { type: 'chip', value: 11, suffix: '', decimals: 0, label: 'Months @ IITTNiF' },
    { type: 'text', text: 'months engineering full-stack apps at IIT Tirupati I-Hub, shipped' },
    { type: 'chip', value: 2, suffix: '', decimals: 0, label: 'Geo Platforms' },
    { type: 'text', text: 'end-to-end geospatial platforms across' },
    { type: 'chip', value: 18, suffix: '+', decimals: 0, label: 'Web & GIS Tools' },
    { type: 'text', text: 'technologies, graduated in' },
    { type: 'chip', value: 2025, suffix: '', decimals: 0, label: 'B.Tech Batch' },
    { type: 'text', text: 'with a' },
    { type: 'chip', value: 7.06, suffix: '', decimals: 2, label: 'B.Tech CGPA' },
    { type: 'text', text: 'CGPA in CSE (AI & ML), following' },
    { type: 'chip', value: 7.17, suffix: '', decimals: 2, label: 'Inter CGPA' },
    { type: 'text', text: 'in Intermediate and' },
    { type: 'chip', value: 8.3, suffix: '', decimals: 1, label: 'SSC CGPA' },
    { type: 'text', text: 'in SSC.' },
  ],

  marqueeItems: [
    { text: 'Full Stack Developer', style: 'anton' },
    { text: 'Python · FastAPI · Flask · React.js', style: 'serif' },
    { text: 'Open to opportunities', style: 'anton' },
    { text: 'PostgreSQL · PostGIS · Docker', style: 'serif' },
    { text: 'Computer Science (AI & ML)', style: 'anton' },
    { text: 'Builder of things', style: 'serif' },
  ],

  projects: [
    {
      id: 'geo-trip-planner',
      repoName: 'geo-trip-planner',
      category: 'Geospatial Web Platform',
      titleMain: 'GEO TRIP',
      titleItalic: 'Planner',
      description:
        'End-to-end Tirupati pilgrimage trip planner with budget-based packages, multi-stop place picker, interactive Leaflet & OSRM route mapping, personal temple QR check-in, and an admin visitor dashboard.',
      tech: [
        'Python',
        'Flask',
        'JavaScript',
        'HTML5 / CSS3',
        'Leaflet',
        'PostgreSQL',
        'SQLite',
        'OpenStreetMap',
        'OSRM',
        'Session Auth',
      ],
      repoUrl: 'https://github.com/deviprasad101',
      visual: 'heatmap',
      visualMeta: {
        title: 'VISITOR CHECK-IN & ROUTE DENSITY',
        unit: 'visits/hr',
      },
    },
    {
      id: 'geo-intel-meta-hub',
      repoName: 'geo-intel-meta-hub',
      category: '3D Spatial Data Catalog',
      titleMain: 'GEO INTEL',
      titleItalic: 'Meta Hub',
      description:
        'Centralized geospatial data hub that ingests vectors, rasters, LAS point clouds, and 3D models into PostGIS and GeoServer, serving WMS/WFS layers with search, 2D maps, and Cesium 3D previews.',
      tech: [
        'Python',
        'Flask',
        'PostgreSQL',
        'PostGIS',
        'GeoServer',
        'Cesium 3D',
        'GDAL / PDAL',
        'ogr2ogr',
        'HTML5 / JS',
      ],
      repoUrl: 'https://github.com/deviprasad101',
      visual: 'orbit',
      visualMeta: {
        core: 'POSTGIS',
        rings: [
          ['Flask', 'WMS/WFS'],
          ['GeoServer', 'Cesium 3D', 'GDAL'],
          ['PDAL', 'ogr2ogr', 'LAS 3D'],
        ],
      },
    },
  ],

  skillGroups: ['Languages', 'Frontend', 'Backend', 'Databases', 'Tools', 'Core'],

  skills: [
    // Languages
    { name: 'Python', group: 'Languages', variant: 'ivory' },
    { name: 'JavaScript', group: 'Languages', variant: 'outline' },
    { name: 'SQL', group: 'Languages', variant: 'smoke' },

    // Frontend
    { name: 'React.js', group: 'Frontend', variant: 'ivory' },
    { name: 'HTML5', group: 'Frontend', variant: 'smoke' },
    { name: 'CSS3', group: 'Frontend', variant: 'outline' },
    { name: 'Leaflet', group: 'Frontend', variant: 'smoke' },
    { name: 'Cesium 3D', group: 'Frontend', variant: 'ivory' },

    // Backend
    { name: 'FastAPI', group: 'Backend', variant: 'ivory' },
    { name: 'Flask', group: 'Backend', variant: 'outline' },
    { name: 'REST APIs', group: 'Backend', variant: 'smoke' },
    { name: 'GeoServer', group: 'Backend', variant: 'outline' },
    { name: 'OSRM', group: 'Backend', variant: 'smoke' },

    // Databases
    { name: 'PostgreSQL', group: 'Databases', variant: 'ivory' },
    { name: 'PostGIS', group: 'Databases', variant: 'outline' },
    { name: 'SQLite', group: 'Databases', variant: 'smoke' },

    // Tools
    { name: 'Docker', group: 'Tools', variant: 'ivory' },
    { name: 'Git', group: 'Tools', variant: 'smoke' },
    { name: 'GitHub', group: 'Tools', variant: 'outline' },
    { name: 'GDAL / PDAL', group: 'Tools', variant: 'smoke' },
    { name: 'VS Code', group: 'Tools', variant: 'outline' },
    { name: 'Cursor', group: 'Tools', variant: 'smoke' },
    { name: 'Claude AI', group: 'Tools', variant: 'outline' },

    // Core
    { name: 'Full Stack', group: 'Core', variant: 'ivory' },
    { name: 'Problem Solving', group: 'Core', variant: 'outline' },
    { name: 'Debugging', group: 'Core', variant: 'smoke' },
    { name: 'Optimization', group: 'Core', variant: 'outline' },
    { name: 'DevOps & SRE', group: 'Core', variant: 'ivory' },
  ],

  // Milestones in chronological (time) order from resume
  journey: [
    {
      year: '2018 — 2019',
      title: 'Secondary School Certificate',
      place: 'Narayana School · Nellore, AP',
      meta: '8.3 CGPA',
      detail: 'Completed secondary school education with strong foundations in mathematics and sciences.',
    },
    {
      year: '2020 — 2021',
      title: 'Intermediate Education',
      place: 'Viswa Sai Junior College · Nellore, AP',
      meta: '7.17 CGPA',
      detail: 'Higher secondary specialization in Mathematics, Physics, and Chemistry.',
    },
    {
      year: '2021 — 2025',
      title: 'B.Tech in CSE (AI & ML)',
      place: 'Malla Reddy Engineering College · Hyderabad',
      meta: '7.06 CGPA',
      detail: 'Undergraduate engineering degree in Computer Science & Engineering (Artificial Intelligence & Machine Learning).',
    },
    {
      year: '2025',
      title: 'Geospatial Full-Stack Systems',
      place: 'Geo Trip Planner & Geo Intel Meta Hub',
      meta: 'Flask · PostGIS · Cesium',
      detail: 'Architected multi-stop routing, QR temple check-ins, and 3D WMS/WFS geospatial catalog platforms.',
    },
    {
      year: '2025 — 2026',
      title: 'Full Stack Developer',
      place: 'IIT Tirupati Navavishkar I-Hub Foundation (IITTNiF)',
      meta: '11/2025 – 09/2026',
      detail: 'Built and deployed full-stack apps with Python, FastAPI, Flask, React.js, PostgreSQL, and Docker.',
    },
  ],

  // Resume does not list separate third-party course certificates; populated from verified resume academic & institutional credentials
  certifications: [
    {
      number: '01',
      category: 'FELLOWSHIP & WORK',
      monogram: 'IIT',
      name: 'Full Stack Software Engineering',
      issuer: 'IIT Tirupati Navavishkar I-Hub Foundation',
      look: 'charcoal',
    },
    {
      number: '02',
      category: 'BACHELOR DEGREE',
      monogram: 'MR',
      name: 'B.Tech Computer Science (AI & ML)',
      issuer: 'Malla Reddy Engineering College',
      look: 'white',
    },
    {
      number: '03',
      category: 'BOARD CREDENTIAL',
      monogram: 'VS',
      name: 'Intermediate Certificate (7.17 CGPA)',
      issuer: 'Viswa Sai Junior College, Nellore',
      look: 'smoke',
    },
    {
      number: '04',
      category: 'BOARD CREDENTIAL',
      monogram: 'NR',
      name: 'Secondary School Certificate (8.3 CGPA)',
      issuer: 'Narayana Educational Institutions',
      look: 'stone',
    },
  ],
};

