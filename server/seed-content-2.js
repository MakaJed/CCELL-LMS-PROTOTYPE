// seed-content-2.js — Courses 5-8 lesson content.
// Called after seed-content.js (courses 1-4).

module.exports = function seedContent2(db) {
  const lessonCount = db.prepare('SELECT COUNT(*) as c FROM lessons').get().c;
  if (lessonCount >= 56) return;

  console.log('[DB] Seeding lesson content for courses 5-8...');

  const insertModule = db.prepare(`
    INSERT OR REPLACE INTO modules (id, course_id, title, description, module_order)
    VALUES (@id, @course_id, @title, @description, @module_order)
  `);

  const insertLesson = db.prepare(`
    INSERT OR REPLACE INTO lessons
      (id, module_id, course_id, title, type, duration, description, images, key_points,
       video_url, powerpoint_url, extra_media_url, pre_test_id, post_test_id, estimated_duration_minutes,
       lesson_order, requires_submission, submission_types, submission_instructions,
       submission_deadline, allow_resubmission, max_resubmissions)
    VALUES
      (@id, @module_id, @course_id, @title, @type, @duration, @description, @images, @key_points,
       @video_url, @powerpoint_url, @extra_media_url, @pre_test_id, @post_test_id, @estimated_duration_minutes,
       @lesson_order, 0, '[]', NULL, NULL, 0, 0)
  `);

  const insertQuiz = db.prepare(`
    INSERT OR REPLACE INTO quizzes
      (id, module_id, course_id, title, passing_score, time_limit, allow_retakes,
       max_retake_attempts, assessment_type, questions)
    VALUES
      (@id, @module_id, @course_id, @title, 70, 15, @allow_retakes,
       @max_retakes, @assessment_type, @questions)
  `);

  const EXTRA_MEDIA = [
    'https://www.youtube.com/embed/IEEhzQoKtQU',
    'https://www.youtube.com/embed/rfscVS0vtbw',
    'https://www.youtube.com/embed/3N3n9wgM9Zs',
    'https://www.youtube.com/embed/0lye_HGn-T4',
    'https://www.youtube.com/embed/7Em89bJEFxQ',
    'https://www.youtube.com/embed/x5EA8r5Tgm8',
    'https://www.youtube.com/embed/AQDCe585Lnc',
    'https://www.youtube.com/embed/inWWhr5tnEA',
  ];
  let _lIdx = 0;

  function L(id, moduleId, courseId, order, title, desc, kpts, imgs, preId, postId, mins) {
    const extraMedia = EXTRA_MEDIA[_lIdx++ % EXTRA_MEDIA.length];
    return {
      id, module_id: moduleId, course_id: courseId, lesson_order: order, title,
      type: 'video', duration: `${mins} min`, description: desc,
      images: JSON.stringify(imgs || []),
      key_points: JSON.stringify(kpts || []),
      video_url: null, powerpoint_url: null,
      extra_media_url: extraMedia,
      pre_test_id: preId, post_test_id: postId,
      estimated_duration_minutes: mins,
    };
  }

  function Q(id, moduleId, courseId, title, type, questions) {
    const isPre = type === 'pre_test';
    return { id, module_id: moduleId, course_id: courseId, title,
      allow_retakes: isPre ? 0 : 1, max_retakes: isPre ? 0 : 3,
      assessment_type: type, questions: JSON.stringify(questions) };
  }

  function mc(id, q, opts, ans) { return { id, question: q, type: 'multiple_choice', options: opts, correct_answer: ans, points: 10 }; }
  function tf(id, q, ans)       { return { id, question: q, type: 'true_false', options: ['True','False'], correct_answer: ans, points: 10 }; }

  db.exec('BEGIN');
  try {

    // ── COURSE 5: Web Development Bootcamp ────────────────────────────────
    insertModule.run({ id:'m5-1', course_id:'5', title:'HTML, CSS & Responsive Design', description:'Building and styling web pages', module_order:1 });
    insertModule.run({ id:'m5-2', course_id:'5', title:'JavaScript and React', description:'Dynamic UIs and component-based development', module_order:2 });

    insertQuiz.run(Q('pre-l5-1-1','m5-1','5','HTML Pre-Test','pre_test',[
      mc('p17-1','HTML stands for:',['HyperText Markup Language','High Text Making Language','HyperTool Markup Listing','Hyperlink Text Making Language'],'HyperText Markup Language'),
      mc('p17-2','Which element wraps all visible page content?',['<head>','<main>','<body>','<html>'],'<body>'),
      tf('p17-3','Semantic HTML elements like <article> and <section> improve accessibility and SEO.','True'),
      mc('p17-4','Attribute that makes a form input required?',['mandatory','validate','required','must'],'required'),
    ]));
    insertQuiz.run(Q('post-l5-1-1','m5-1','5','HTML Post-Test','post_test',[
      mc('o17-1','Purpose of <meta charset="UTF-8">?',['Set background','Define character encoding','Add keywords','Control viewport'],'Define character encoding'),
      mc('o17-2','HTML5 element for navigation links?',['<links>','<menu>','<nav>','<navigate>'],'<nav>'),
      tf('o17-3','The <div> element is a semantic HTML element.','False'),
      mc('o17-4','Attribute specifying a hyperlink URL?',['src','href','link','url'],'href'),
    ]));
    insertLesson.run(L('l5-1-1','m5-1','5',1,'HTML5 Structure and Semantics',
      'HTML (HyperText Markup Language) is the backbone of every web page. HTML5 introduced semantic elements — <header>, <nav>, <main>, <article>, <section>, <footer> — that describe meaning and improve accessibility, SEO, and maintainability. Every browser renders HTML into a DOM tree that JavaScript and CSS interact with.',
      ['HTML defines structure; CSS defines style; JavaScript defines behavior — the web trinity','Semantic elements convey meaning: <nav>=navigation, <article>=standalone content, <footer>=page footer','The DOM (Document Object Model) is the browser\'s tree representation of the HTML document','Forms: use correct input types (email, tel, number) and always associate <label> with inputs','Accessibility: alt text for images, aria-label for buttons, proper heading hierarchy (H1→H2→H3)'],
      ['https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800','https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800'],
      'pre-l5-1-1','post-l5-1-1',30));

    insertQuiz.run(Q('pre-l5-1-2','m5-1','5','CSS Pre-Test','pre_test',[
      mc('p18-1','CSS stands for:',['Cascading Style Sheets','Computer Style System','Creative Styling Scripts','Centralized Style Storage'],'Cascading Style Sheets'),
      mc('p18-2','CSS property for space between border and content?',['margin','padding','spacing','border-gap'],'padding'),
      tf('p18-3','Flexbox is a one-dimensional layout system (row or column).','True'),
      mc('p18-4','CSS property to make text bold?',['text-weight','font-bold','font-weight','text-style'],'font-weight'),
    ]));
    insertQuiz.run(Q('post-l5-1-2','m5-1','5','CSS Post-Test','post_test',[
      mc('o18-1','CSS unit relative to the root element font size?',['em','px','%','rem'],'rem'),
      mc('o18-2','Select all <p> elements with class "intro":',['p#intro','.intro p','p.intro','#intro p'],'p.intro'),
      tf('o18-3','CSS Grid is a two-dimensional layout system.','True'),
      mc('o18-4','Responsive design means:',['Fast page loading','Site works and looks good on all screen sizes','Using flexbox only','Having animations'],'Site works and looks good on all screen sizes'),
    ]));
    insertLesson.run(L('l5-1-2','m5-1','5',2,'CSS3 and Flexbox/Grid Layout',
      'CSS styles, positions, and animates web elements. The box model (content + padding + border + margin) governs every element\'s space. Flexbox handles one-dimensional layouts; CSS Grid handles two-dimensional page layouts. Media queries enable responsive design that adapts to any screen size.',
      ['Box model: content + padding + border + margin — visualize in browser DevTools','Flexbox properties: display:flex, justify-content, align-items, flex-wrap, gap','CSS Grid: grid-template-columns/rows, grid-column/row-span for complex layouts','Media queries: @media (max-width: 768px) { ... } — the core of responsive design','CSS variables: --primary: #3b82f6; then use var(--primary) — keep styles consistent'],
      ['https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800'],
      'pre-l5-1-2','post-l5-1-2',40));

    insertQuiz.run(Q('pre-l5-2-1','m5-2','5','JavaScript Pre-Test','pre_test',[
      mc('p19-1','Block-scoped variable declarations in modern JS?',['var','let / const','dim','define'],'let / const'),
      mc('p19-2','What does asynchronous mean in JavaScript?',['Code runs line-by-line','Operations run without blocking the main thread','Variables are shared','Loops run faster'],'Operations run without blocking the main thread'),
      tf('p19-3','Arrow functions have their own "this" binding.','False'),
      mc('p19-4','What does the spread operator (...) do?',['Multiplies arrays','Expands an iterable into individual elements','Creates a loop','Deletes items'],'Expands an iterable into individual elements'),
    ]));
    insertQuiz.run(Q('post-l5-2-1','m5-2','5','JavaScript Post-Test','post_test',[
      mc('o19-1','Promise.all() does:',['Runs promises sequentially','Runs multiple promises concurrently and resolves when all complete','Cancels pending promises','Retries failed promises'],'Runs multiple promises concurrently and resolves when all complete'),
      mc('o19-2','Array.prototype.map() does:',['Sorts an array','Creates a new array by applying a function to each element','Filters elements','Finds an index'],'Creates a new array by applying a function to each element'),
      tf('o19-3','async/await is syntactic sugar built on top of Promises.','True'),
      mc('o19-4','JSON.stringify() does:',['Parses JSON to JS object','Converts JS object to JSON string','Validates JSON','Deletes properties'],'Converts JS object to JSON string'),
    ]));
    insertLesson.run(L('l5-2-1','m5-2','5',1,'JavaScript ES6+ Fundamentals',
      'Modern JavaScript (ES6+) features are essential for professional development: let/const for block scoping, arrow functions with lexical this, template literals, destructuring, spread/rest operators, and async/await for clean asynchronous code. Mastering these patterns separates competent developers from beginners.',
      ['let/const vs var: prefer const by default, use let for reassignment, avoid var entirely','Arrow functions: shorter syntax + lexical this — ideal for array methods and callbacks','Destructuring: const { name } = user or const [first] = arr — cleaner code','Promises and async/await eliminate callback hell for API calls and async operations','Array methods: map (transform), filter (subset), reduce (accumulate), find (single item)'],
      ['https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800'],
      'pre-l5-2-1','post-l5-2-1',50));

    insertQuiz.run(Q('pre-l5-2-2','m5-2','5','React Pre-Test','pre_test',[
      mc('p20-1','React is primarily used to build:',['Server APIs','Databases','User interfaces (UI)','Operating systems'],'User interfaces (UI)'),
      mc('p20-2','JSX is:',['A testing library','A syntax extension for writing HTML-like code in JavaScript','A CSS preprocessor','A query language'],'A syntax extension for writing HTML-like code in JavaScript'),
      tf('p20-3','useState is a React Hook for managing component state.','True'),
      mc('p20-4','Props in React are:',['State variables','Data passed from parent to child components','CSS class names','Database records'],'Data passed from parent to child components'),
    ]));
    insertQuiz.run(Q('post-l5-2-2','m5-2','5','React Post-Test','post_test',[
      mc('o20-1','useEffect does:',['Manages state','Performs side effects (data fetching, subscriptions) after render','Styles components','Routes between pages'],'Performs side effects (data fetching, subscriptions) after render'),
      mc('o20-2','The virtual DOM is:',['A real browser DOM copy','A lightweight in-memory representation used for efficient updates','The HTML file','A JS module'],'A lightweight in-memory representation used for efficient updates'),
      tf('o20-3','React components must return a single root element (or Fragment).','True'),
      mc('o20-4','Hook for memoizing expensive computations?',['useRef','useCallback','useMemo','useContext'],'useMemo'),
    ]));
    insertLesson.run(L('l5-2-2','m5-2','5',2,'React Components and State',
      'React is a JavaScript library for building component-based UIs. Functional components with hooks are the modern standard: useState tracks state, useEffect handles side effects, useContext shares global state. The virtual DOM ensures efficient updates by re-rendering only changed components.',
      ['Functional components with hooks are the modern React standard — class components are legacy','useState: const [count, setCount] = useState(0) — calling the setter triggers a re-render','Props flow down (parent to child); callbacks flow up (child calls parent handler)','useEffect(fn, [deps]): runs after render; empty array [] runs once on mount','Key prop in lists: helps React identify which items changed for efficient reconciliation'],
      ['https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800'],
      'pre-l5-2-2','post-l5-2-2',55));

    // ── COURSE 6: Financial Literacy for Professionals ─────────────────────
    insertModule.run({ id:'m6-1', course_id:'6', title:'Personal Finance Fundamentals', description:'Budgeting, saving, and investing basics', module_order:1 });
    insertModule.run({ id:'m6-2', course_id:'6', title:'Professional and Business Finance', description:'Financial statements, tax, and retirement', module_order:2 });

    insertQuiz.run(Q('pre-l6-1-1','m6-1','6','Budgeting Pre-Test','pre_test',[
      mc('p21-1','The 50/30/20 rule allocates what percentage to savings?',['50%','30%','20%','10%'],'20%'),
      mc('p21-2','Cash flow is:',['Total assets','Net movement of money in and out over a period','Credit limit','Bank balance'],'Net movement of money in and out over a period'),
      tf('p21-3','An emergency fund should cover 3-6 months of living expenses.','True'),
      mc('p21-4','Difference between a need and a want?',['Needs are expensive; wants are cheap','Needs are essential for survival; wants improve quality of life','They are the same','Wants are more important'],'Needs are essential for survival; wants improve quality of life'),
    ]));
    insertQuiz.run(Q('post-l6-1-1','m6-1','6','Budgeting Post-Test','post_test',[
      mc('o21-1','Budgeting method that assigns every peso a purpose?',['50/30/20 rule','Zero-based budgeting','Envelope method','Pay-yourself-first'],'Zero-based budgeting'),
      mc('o21-2','Lifestyle inflation means:',['Investing in better products','Increasing spending as income rises, preventing wealth accumulation','Inflation from luxury goods','Rising housing costs'],'Increasing spending as income rises, preventing wealth accumulation'),
      tf('o21-3','Tracking expenses is the most important first step in budgeting.','True'),
      mc('o21-4','Which is a fixed expense?',['Groceries','Entertainment','Monthly rent','Utility bills'],'Monthly rent'),
    ]));
    insertLesson.run(L('l6-1-1','m6-1','6',1,'Budgeting and Cash Flow Management',
      'A budget is the foundation of financial health. The 50/30/20 rule allocates 50% to needs, 30% to wants, and 20% to savings/debt. Zero-based budgeting assigns every peso a job. Building an emergency fund of 3-6 months of essential expenses before investing protects against financial disruptions.',
      ['50/30/20 rule: 50% needs (rent, food, utilities), 30% wants (dining, entertainment), 20% savings/debt','Zero-based budget: income minus all assigned expenses = zero — forces intentional spending','Track every expense for 30 days before creating your first formal budget','Emergency fund: 3-6 months of essential expenses in a liquid savings account — priority #1','Lifestyle inflation silently destroys wealth — keep expense growth below income growth'],
      ['https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800','https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800'],
      'pre-l6-1-1','post-l6-1-1',30));

    insertQuiz.run(Q('pre-l6-1-2','m6-1','6','Investing Pre-Test','pre_test',[
      mc('p22-1','Compound interest is:',['Interest on principal only','Interest on both principal and previously accumulated interest','A bank fee','Flat rate interest'],'Interest on both principal and previously accumulated interest'),
      mc('p22-2','Diversification in investing means:',['Putting all money in one stock','Spreading investments across assets to reduce risk','Only buying bonds','Only real estate'],'Spreading investments across assets to reduce risk'),
      tf('p22-3','Higher potential returns generally come with higher risk.','True'),
      mc('p22-4','A mutual fund is:',['A government savings program','A pool of money from many investors managed by a professional','A type of bank account','A private loan'],'A pool of money from many investors managed by a professional'),
    ]));
    insertQuiz.run(Q('post-l6-1-2','m6-1','6','Investing Post-Test','post_test',[
      mc('o22-1','The Rule of 72 is used to:',['Calculate taxes','Estimate how many years to double money (72 ÷ interest rate)','Measure stock risk','Determine retirement age'],'Estimate how many years to double money (72 ÷ interest rate)'),
      mc('o22-2','Dollar-cost averaging means:',['Buying only when prices are low','Investing a fixed amount at regular intervals regardless of market price','Converting to USD','Timing the market'],'Investing a fixed amount at regular intervals regardless of market price'),
      tf('o22-3','Stock market returns have historically averaged 8-10% annually over long periods.','True'),
      mc('o22-4','A bond is:',['Ownership stake in a company','A loan to a company/government in exchange for periodic interest payments','A type of mutual fund','A savings account'],'A loan to a company/government in exchange for periodic interest payments'),
    ]));
    insertLesson.run(L('l6-1-2','m6-1','6',2,'Savings, Investments, and Compound Interest',
      'Saving is setting money aside; investing puts money to work for growth. Compound interest — earning interest on interest — is the most powerful wealth-building force. The Rule of 72 estimates doubling time. Starting early and diversifying across asset classes are the two most impactful investing decisions.',
      ['Compound interest: interest earns interest — a ₱10,000 investment at 8% doubles in ~9 years','Rule of 72: 72 ÷ interest rate = years to double (e.g., 6% → 12 years, 12% → 6 years)','Start early: ₱1,000/month at 8% for 30 years → ~₱1.5M; starting 10 years later halves it','Asset classes: stocks (growth), bonds (income/stability), real estate, cash equivalents','Dollar-cost averaging: invest fixed amounts regularly — removes timing risk, builds discipline'],
      ['https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800'],
      'pre-l6-1-2','post-l6-1-2',35));

    insertQuiz.run(Q('pre-l6-2-1','m6-2','6','Financial Statements Pre-Test','pre_test',[
      mc('p23-1','Statement showing revenues and expenses over a period?',['Balance sheet','Cash flow statement','Income statement','Statement of equity'],'Income statement'),
      mc('p23-2','Liquidity means:',['How profitable a company is','How easily assets convert to cash','Total company debt','Number of employees'],'How easily assets convert to cash'),
      tf('p23-3','Balance sheet equation: Assets = Liabilities + Equity.','True'),
      mc('p23-4','EBITDA stands for:',['Earnings Before Interest, Taxes, Depreciation, and Amortization','Expense Budget Including Total Direct Allocation','Estimated Balance Including Total Debt Allowance','Equity Basis Including Tax Deductions'],'Earnings Before Interest, Taxes, Depreciation, and Amortization'),
    ]));
    insertQuiz.run(Q('post-l6-2-1','m6-2','6','Financial Statements Post-Test','post_test',[
      mc('o23-1','Current ratio of 2:1 indicates:',['Company losing money','Twice as many current assets as liabilities — healthy liquidity','Highly leveraged','More debt than equity'],'Twice as many current assets as liabilities — healthy liquidity'),
      mc('o23-2','Depreciation is recorded to:',['Increase profits','Allocate cost of a long-term asset over its useful life','Reduce cash immediately','Only for tax purposes'],'Allocate cost of a long-term asset over its useful life'),
      tf('o23-3','Free cash flow is cash generated after capital expenditures.','True'),
      mc('o23-4','P/E ratio measures:',['Profit per employee','Price per share relative to earnings per share','Payment-to-earnings ratio','Pension and equity balance'],'Price per share relative to earnings per share'),
    ]));
    insertLesson.run(L('l6-2-1','m6-2','6',1,'Understanding Financial Statements',
      'The three core financial statements form a complete picture of financial health: the Income Statement (P&L) shows revenue minus expenses; the Balance Sheet is a snapshot of assets, liabilities, and equity; the Cash Flow Statement shows actual cash movements across operating, investing, and financing activities.',
      ['Income Statement: Revenue − COGS = Gross Profit → − Operating Expenses = EBITDA → Net Income','Balance Sheet: Assets = Liabilities + Owner\'s Equity — a point-in-time financial snapshot','Cash Flow: Operating (core business) + Investing (assets) + Financing (debt/equity) = Net change','EBITDA measures operational profitability before non-cash/non-operational items','Key ratios: Current Ratio (liquidity), Debt-to-Equity (leverage), ROE (return on equity)'],
      ['https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800'],
      'pre-l6-2-1','post-l6-2-1',35));

    insertQuiz.run(Q('pre-l6-2-2','m6-2','6','Tax & Retirement Pre-Test','pre_test',[
      mc('p24-1','Withholding tax in the Philippines is:',['A tax on imports','Income tax deducted by employers before paying employees','A value-added tax','A tax on investments'],'Income tax deducted by employers before paying employees'),
      mc('p24-2','Purpose of SSS/GSIS?',['Educational scholarships','Social security benefits including retirement, disability, and death','Regulate banking','Manage government investments'],'Social security benefits including retirement, disability, and death'),
      tf('p24-3','Starting retirement savings at 25 is significantly better than starting at 35.','True'),
      mc('p24-4','VAT in the Philippines is:',['12% value-added tax on most goods and services','A voluntary retirement fund','A bank savings product','Corporate income tax'],'12% value-added tax on most goods and services'),
    ]));
    insertQuiz.run(Q('post-l6-2-2','m6-2','6','Tax & Retirement Post-Test','post_test',[
      mc('o24-1','TIN is used for:',['Social media accounts','Identifying taxpayers for tax purposes','Passport applications','Vehicle registration'],'Identifying taxpayers for tax purposes'),
      mc('o24-2','Pag-IBIG (HDMF) provides:',['Free education','Housing loans and a savings program for workers','Free healthcare','Business grants'],'Housing loans and a savings program for workers'),
      tf('o24-3','Net salary is gross salary after all mandatory and voluntary deductions.','True'),
      mc('o24-4','Philippine income tax is:',['Flat 25% for everyone','Progressive — higher income = higher tax rate (BIR table)','Only for corporations','Paid annually in a lump sum only'],'Progressive — higher income = higher tax rate (BIR table)'),
    ]));
    insertLesson.run(L('l6-2-2','m6-2','6',2,'Tax Planning and Retirement',
      'Tax planning ensures compliance while minimizing tax burden. In the Philippines, professionals must understand BIR withholding taxes, mandatory contributions (SSS/GSIS, Pag-IBIG, PhilHealth), and year-end filing. Retirement planning starts with mandatory contributions but must be supplemented with personal investments — time is the most critical factor.',
      ['Philippine income tax is progressive: higher income brackets pay higher percentages (BIR Table)','Mandatory contributions: SSS/GSIS (retirement/disability), Pag-IBIG (housing), PhilHealth (health)','Tax deductions reduce taxable income; tax credits directly reduce the tax amount owed','Start retirement at 25 vs 35: the 10-year head start nearly doubles the final balance','Diversify retirement savings: mandatory contributions + PERA account + personal investments'],
      ['https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800'],
      'pre-l6-2-2','post-l6-2-2',35));

    // ── COURSE 7: Cisco CCNA Certification Prep ───────────────────────────
    insertModule.run({ id:'m7-1', course_id:'7', title:'Network Fundamentals', description:'OSI model, TCP/IP, and IP addressing', module_order:1 });
    insertModule.run({ id:'m7-2', course_id:'7', title:'Routing and Switching', description:'Router/switch configuration, OSPF, and WAN', module_order:2 });

    insertQuiz.run(Q('pre-l7-1-1','m7-1','7','OSI Model Pre-Test','pre_test',[
      mc('p25-1','How many layers in the OSI model?',['4','5','7','9'],'7'),
      mc('p25-2','OSI layer responsible for end-to-end communication and error recovery?',['Network','Data Link','Physical','Transport'],'Transport'),
      tf('p25-3','IP operates at the Network layer of the OSI model.','True'),
      mc('p25-4','Protocol providing reliable, connection-oriented Transport layer service?',['UDP','IP','TCP','ICMP'],'TCP'),
    ]));
    insertQuiz.run(Q('post-l7-1-1','m7-1','7','OSI Model Post-Test','post_test',[
      mc('o25-1','Role of the Data Link layer?',['IP addressing','Physical signal transmission','Node-to-node delivery using MAC addresses','Application protocols'],'Node-to-node delivery using MAC addresses'),
      mc('o25-2','Which TCP/IP layer maps to OSI layers 5, 6, and 7?',['Internet','Transport','Network Access','Application'],'Application'),
      tf('o25-3','UDP is faster than TCP but does not guarantee delivery or order.','True'),
      mc('o25-4','ARP does what?',['Routes packets','Maps IP addresses to MAC addresses','Forwards frames','Manages HTTP'],'Maps IP addresses to MAC addresses'),
    ]));
    insertLesson.run(L('l7-1-1','m7-1','7',1,'OSI and TCP/IP Models',
      'The OSI model provides a 7-layer framework for network communication. The TCP/IP model simplifies this to 4 layers. Understanding how data encapsulates traveling down the stack (data → segment → packet → frame → bits) and de-encapsulates on the receiving end is foundational to all networking.',
      ['OSI layers: Physical, Data Link, Network, Transport, Session, Presentation, Application','Layer 1 Physical: cables, signals, bits — hubs, repeaters','Layer 2 Data Link: MAC addresses, frames, switches, Ethernet','Layer 3 Network: IP addresses, routing, routers — logical addressing','Layer 4 Transport: TCP (reliable, connection-oriented) vs UDP (fast, connectionless)'],
      ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800','https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800'],
      'pre-l7-1-1','post-l7-1-1',40));

    insertQuiz.run(Q('pre-l7-1-2','m7-1','7','IP Addressing Pre-Test','pre_test',[
      mc('p26-1','Bits in an IPv4 address?',['16','32','64','128'],'32'),
      mc('p26-2','Subnet mask for a /24 network?',['255.0.0.0','255.255.0.0','255.255.255.0','255.255.255.128'],'255.255.255.0'),
      tf('p26-3','192.168.1.0/24 is a private IP address range.','True'),
      mc('p26-4','Usable host addresses in a /24 subnet?',['256','254','255','128'],'254'),
    ]));
    insertQuiz.run(Q('post-l7-1-2','m7-1','7','IP Addressing Post-Test','post_test',[
      mc('o26-1','CIDR notation expresses:',['A routing protocol','IP address with subnet mask (e.g. 192.168.1.0/24)','A network cable type','A Cisco command'],'IP address with subnet mask (e.g. 192.168.1.0/24)'),
      mc('o26-2','IPv6 uses how many bits?',['32','64','96','128'],'128'),
      tf('o26-3','VLSM allows more efficient use of IP address space.','True'),
      mc('o26-4','Broadcast address of 192.168.1.0/24?',['192.168.1.0','192.168.1.1','192.168.1.254','192.168.1.255'],'192.168.1.255'),
    ]));
    insertLesson.run(L('l7-1-2','m7-1','7',2,'IP Addressing and Subnetting',
      'IPv4 uses 32-bit addresses in dotted decimal notation. Subnetting divides networks into subnetworks using a subnet mask. CIDR (Classless Inter-Domain Routing) notation specifies prefix length. VLSM optimizes address allocation. IPv6 with 128-bit addresses solves IPv4 exhaustion and adds built-in security.',
      ['IPv4: 32 bits, 4 octets — 4.3 billion addresses (essentially exhausted by early 2010s)','Subnet mask: divides address into network portion and host portion','/24 = 255.255.255.0 = 256 total addresses, 254 usable (subtract network ID and broadcast)','Private ranges (RFC 1918): 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 — not internet-routable','IPv6: 128-bit hex (e.g. 2001:0db8::1) — ~340 undecillion addresses, mandatory IPSec support'],
      ['https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800'],
      'pre-l7-1-2','post-l7-1-2',50));

    insertQuiz.run(Q('pre-l7-2-1','m7-2','7','Router Config Pre-Test','pre_test',[
      mc('p27-1','Cisco CLI mode for configuring interface settings?',['User EXEC mode','Privileged EXEC mode','Global Configuration mode','Interface Configuration mode'],'Interface Configuration mode'),
      mc('p27-2','Command to display the routing table?',['show ip route','display routes','list routing','show table'],'show ip route'),
      tf('p27-3','The "no shutdown" command enables a Cisco interface.','True'),
      mc('p27-4','Command to save running config to NVRAM?',['save config','write memory / copy run start','store config','commit config'],'write memory / copy run start'),
    ]));
    insertQuiz.run(Q('post-l7-2-1','m7-2','7','Router Config Post-Test','post_test',[
      mc('o27-1','Purpose of VLANs?',['Increase speed','Logically segment a switch into multiple broadcast domains','Replace routers','Provide wireless access'],'Logically segment a switch into multiple broadcast domains'),
      mc('o27-2','A trunk port:',['Carries one VLAN only','Carries traffic for multiple VLANs using 802.1Q tagging','Is the internet uplink','Is used for management only'],'Carries traffic for multiple VLANs using 802.1Q tagging'),
      tf('o27-3','STP prevents switching loops by blocking redundant paths.','True'),
      mc('o27-4','Inter-VLAN routing requires:',['A hub','A Layer 3 switch or router with sub-interfaces','A wireless access point','Additional IPs only'],'A Layer 3 switch or router with sub-interfaces'),
    ]));
    insertLesson.run(L('l7-2-1','m7-2','7',1,'Cisco Router and Switch Configuration',
      'Cisco IOS uses a hierarchical CLI: User EXEC (>), Privileged EXEC (#), Global Config (config#), and sub-modes. Basic setup includes setting hostnames, encrypted passwords, interface IP addresses, and enabling interfaces with "no shutdown". VLANs segment switch networks into separate broadcast domains; trunk ports carry multi-VLAN traffic.',
      ['CLI hierarchy: User > → enable → Privileged # → conf t → Global (config)# → interface (config-if)#','enable secret <pass>: creates MD5-encrypted privileged password in running config','Interface config: ip address X.X.X.X Y.Y.Y.Y then no shutdown — interface is down by default','VLANs: logical broadcast domain separation — improves security, performance, and manageability','802.1Q trunking: trunk ports carry tagged frames for multiple VLANs between switches and routers'],
      ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800'],
      'pre-l7-2-1','post-l7-2-1',55));

    insertQuiz.run(Q('pre-l7-2-2','m7-2','7','OSPF & WAN Pre-Test','pre_test',[
      mc('p28-1','OSPF is which type of routing protocol?',['Distance vector','Path vector','Link-state','Policy-based'],'Link-state'),
      mc('p28-2','Metric OSPF uses to determine best path?',['Hop count','Bandwidth (cost)','Delay','Load'],'Bandwidth (cost)'),
      tf('p28-3','OSPF routers elect a Designated Router (DR) on multi-access networks.','True'),
      mc('p28-4','Administrative distance of OSPF on Cisco?',['90','100','110','120'],'110'),
    ]));
    insertQuiz.run(Q('post-l7-2-2','m7-2','7','OSPF & WAN Post-Test','post_test',[
      mc('o28-1','NAT stands for:',['Network Access Table','Network Address Translation','Node Authentication Token','Network Adjacency Tracking'],'Network Address Translation'),
      mc('o28-2','PAT allows:',['One host to use multiple IPs','Multiple hosts to share a single public IP using port numbers','IP routing without a gateway','Wireless encryption'],'Multiple hosts to share a single public IP using port numbers'),
      tf('o28-3','QoS prioritizes certain traffic types to ensure performance.','True'),
      mc('o28-4','SD-WAN provides:',['Physical network cables','Software-controlled intelligent routing across multiple WAN links','Wireless LAN management','Firewall configuration'],'Software-controlled intelligent routing across multiple WAN links'),
    ]));
    insertLesson.run(L('l7-2-2','m7-2','7',2,'OSPF, EIGRP, and WAN Technologies',
      'OSPF (link-state) and EIGRP (Cisco hybrid) are dynamic routing protocols that automatically discover and maintain routes. OSPF uses Dijkstra\'s algorithm with bandwidth-based cost. NAT/PAT translate private IPs to public for internet access. Modern WAN technologies — MPLS, SD-WAN, DSL — connect distributed networks with varying performance guarantees.',
      ['OSPF: link-state protocol — every router builds a complete map (LSDB) of the network topology','OSPF uses Dijkstra\'s SPF algorithm to compute shortest path; cost = 100 Mbps ÷ interface bandwidth','EIGRP: Cisco hybrid (distance-vector + link-state) — fast convergence, supports unequal-cost load balancing','NAT: translates private IPs to public; PAT (overload) maps many private IPs to one public IP via ports','SD-WAN: software-defined WAN — intelligently routes traffic across MPLS, broadband, and LTE links'],
      ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800'],
      'pre-l7-2-2','post-l7-2-2',50));

    // ── COURSE 8: Ethical Hacking & Penetration Testing ───────────────────
    insertModule.run({ id:'m8-1', course_id:'8', title:'Penetration Testing Methodology', description:'Ethics, phases, and information gathering', module_order:1 });
    insertModule.run({ id:'m8-2', course_id:'8', title:'Exploitation and Reporting', description:'Vulnerability assessment, exploiting, and remediation', module_order:2 });

    insertQuiz.run(Q('pre-l8-1-1','m8-1','8','Pen Testing Pre-Test','pre_test',[
      mc('p29-1','What distinguishes ethical hacking from malicious hacking?',['Better tools','Authorization and legal permission from the target organization','Anonymity','Using only public exploits'],'Authorization and legal permission from the target organization'),
      mc('p29-2','Phases of penetration testing in order?',['Exploit, Scan, Report, Plan','Reconnaissance, Scanning, Exploitation, Post-Exploitation, Reporting','Attack, Defend, Recover, Document','Plan, Test, Fix, Ignore'],'Reconnaissance, Scanning, Exploitation, Post-Exploitation, Reporting'),
      tf('p29-3','A penetration tester must always have written authorization before testing.','True'),
      mc('p29-4','What is a "scope" in pen testing?',['The testing tool used','The defined boundaries of what can and cannot be tested','The attacker\'s skill level','The client\'s budget'],'The defined boundaries of what can and cannot be tested'),
    ]));
    insertQuiz.run(Q('post-l8-1-1','m8-1','8','Pen Testing Post-Test','post_test',[
      mc('o29-1','Passive reconnaissance means:',['Directly probing the target','Gathering information without directly interacting with the target','Running port scans','Exploiting vulnerabilities'],'Gathering information without directly interacting with the target'),
      mc('o29-2','What does OSINT stand for?',['Online Security Intelligence Network','Open Source INTelligence — publicly available information','Operational System Integration Test','Offensive Security Incident Network Technology'],'Open Source INTelligence — publicly available information'),
      tf('o29-3','Nmap is a commonly used port scanning and network discovery tool.','True'),
      mc('o29-4','What is the purpose of a rules of engagement (ROE) document?',['Define payment terms','Specify technical and legal boundaries of the penetration test','List employee names','Describe target hardware'],'Specify technical and legal boundaries of the penetration test'),
    ]));
    insertLesson.run(L('l8-1-1','m8-1','8',1,'Ethics, Laws, and Testing Phases',
      'Ethical hacking is authorized penetration testing performed to find and fix security weaknesses before malicious actors exploit them. It requires written authorization, clearly defined scope, and strict legal compliance. The 5 phases — Reconnaissance, Scanning, Exploitation, Post-Exploitation, Reporting — provide a structured methodology.',
      ['Ethical hacking REQUIRES written authorization — testing without it is illegal regardless of intent','5 phases: Reconnaissance (info gathering) → Scanning → Exploitation → Post-Exploitation → Reporting','Scope document defines what can be tested (IP ranges, systems, methods) and what is off-limits','Rules of Engagement (ROE): timing, communication protocols, emergency contacts, allowed techniques','Legal frameworks: Computer Fraud and Abuse Act (US), RA 10175 (PH Cybercrime Prevention Act)'],
      ['https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800','https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800'],
      'pre-l8-1-1','post-l8-1-1',35));

    insertQuiz.run(Q('pre-l8-1-2','m8-1','8','Reconnaissance Pre-Test','pre_test',[
      mc('p30-1','Which technique gathers info without direct target contact?',['Active reconnaissance','Passive reconnaissance','Port scanning','Vulnerability scanning'],'Passive reconnaissance'),
      mc('p30-2','Google Dork queries are used to:',['Speed up Google searches','Find sensitive information indexed by Google using advanced operators','Hack Google servers','Create Google Ads'],'Find sensitive information indexed by Google using advanced operators'),
      tf('p30-3','Whois lookup can reveal domain registration information including owner details.','True'),
      mc('p30-4','What does DNS enumeration reveal?',['User passwords','Subdomains, mail servers, and IP addresses associated with a domain','Credit card numbers','Source code'],'Subdomains, mail servers, and IP addresses associated with a domain'),
    ]));
    insertQuiz.run(Q('post-l8-1-2','m8-1','8','Reconnaissance Post-Test','post_test',[
      mc('o30-1','Shodan is used for:',['Social media hacking','Discovering internet-connected devices and their open services','Email phishing','Password cracking'],'Discovering internet-connected devices and their open services'),
      mc('o30-2','What information does a WHOIS query return?',['Website source code','Domain registrant, registration dates, and nameserver info','Email contents','Server passwords'],'Domain registrant, registration dates, and nameserver info'),
      tf('o30-3','theHarvester is a tool used for gathering emails, subdomains, and open ports.','True'),
      mc('o30-4','Social engineering in reconnaissance involves:',['Scanning network ports','Manipulating people to reveal confidential information','Writing exploit code','Brute-forcing passwords'],'Manipulating people to reveal confidential information'),
    ]));
    insertLesson.run(L('l8-1-2','m8-1','8',2,'Reconnaissance and Information Gathering',
      'Reconnaissance is the intelligence-gathering phase. Passive reconnaissance uses public sources (OSINT) without touching the target. Active reconnaissance directly probes the target. Tools like Nmap, theHarvester, Shodan, and Google Dorks reveal a surprisingly detailed picture of the target attack surface.',
      ['Passive recon: WHOIS, DNS lookups, Shodan, LinkedIn, Google Dorks — no direct target contact','Active recon: Nmap port scanning, service version detection, OS fingerprinting — leaves traces','OSINT tools: theHarvester (emails/subdomains), Maltego (link analysis), Recon-ng (framework)','Google Dorks: site:, filetype:, inurl: operators expose misconfigured servers and sensitive files','Attack surface: all entry points — exposed services, employee emails, public code repositories'],
      ['https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800'],
      'pre-l8-1-2','post-l8-1-2',40));

    insertQuiz.run(Q('pre-l8-2-1','m8-2','8','Exploitation Pre-Test','pre_test',[
      mc('p31-1','What is Metasploit?',['A network scanner','An exploitation framework for developing and executing exploit code','A password manager','A firewall product'],'An exploitation framework for developing and executing exploit code'),
      mc('p31-2','What is a payload in exploit terminology?',['The vulnerability being exploited','Code executed on the target after a successful exploit','The scan result','The target IP address'],'Code executed on the target after a successful exploit'),
      tf('p31-3','A reverse shell connects from the target back to the attacker.','True'),
      mc('p31-4','What does CVE stand for?',['Common Vulnerability Enumeration','Critical Vulnerability Exploit','Common Vulnerabilities and Exposures','Certified Vulnerability Expert'],'Common Vulnerabilities and Exposures'),
    ]));
    insertQuiz.run(Q('post-l8-2-1','m8-2','8','Exploitation Post-Test','post_test',[
      mc('o31-1','Privilege escalation means:',['Creating a new user account','Gaining higher-level permissions than initially obtained','Deleting logs','Installing a backdoor'],'Gaining higher-level permissions than initially obtained'),
      mc('o31-2','What is lateral movement in post-exploitation?',['Closing exploited sessions','Moving from one compromised system to others within the network','Exfiltrating data immediately','Reporting findings to client'],'Moving from one compromised system to others within the network'),
      tf('o31-3','Covering tracks (clearing logs) is a standard step in ethical penetration testing.','False'),
      mc('o31-4','A C2 (Command and Control) server is used to:',['Store backups','Remotely communicate with and control compromised systems','Block incoming traffic','Monitor network performance'],'Remotely communicate with and control compromised systems'),
    ]));
    insertLesson.run(L('l8-2-1','m8-2','8',1,'Vulnerability Assessment and Exploitation',
      'Vulnerability assessment scans for known weaknesses (using tools like Nessus, OpenVAS). Exploitation attempts to leverage these weaknesses to gain unauthorized access. Metasploit Framework provides modules for hundreds of exploits. Understanding CVE (Common Vulnerabilities and Exposures) scores (CVSS) helps prioritize findings.',
      ['Vulnerability scanning: Nessus, OpenVAS, Nikto — automated detection of known CVEs','CVE database: standardized identifiers for known vulnerabilities (e.g., CVE-2021-44228 = Log4Shell)','CVSS score: 0-10 severity scale — Critical (9-10), High (7-8.9), Medium (4-6.9), Low (0-3.9)','Metasploit: search for exploit module → configure options → set payload → run exploit','Payload types: bind shell (target listens), reverse shell (target connects back to attacker)'],
      ['https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800'],
      'pre-l8-2-1','post-l8-2-1',55));

    insertQuiz.run(Q('pre-l8-2-2','m8-2','8','Reporting Pre-Test','pre_test',[
      mc('p32-1','What should a penetration test report always include?',['Only the exploits used','Executive summary, technical findings, risk ratings, and remediation recommendations','A list of all tools downloaded','The tester\'s personal information'],'Executive summary, technical findings, risk ratings, and remediation recommendations'),
      mc('p32-2','What is remediation in the context of pen testing?',['Finding more vulnerabilities','Fixing or mitigating the identified security weaknesses','Re-running the scan','Billing the client'],'Fixing or mitigating the identified security weaknesses'),
      tf('p32-3','A penetration test report should be written for both technical and non-technical audiences.','True'),
      mc('p32-4','What does POC stand for in a pen test report?',['Point of Contact','Proof of Concept — demonstrating that a vulnerability is exploitable','Part of the Contract','Pattern of Compromise'],'Proof of Concept — demonstrating that a vulnerability is exploitable'),
    ]));
    insertQuiz.run(Q('post-l8-2-2','m8-2','8','Reporting Post-Test','post_test',[
      mc('o32-1','CVSS score of 9.5 is classified as:',['Low','Medium','High','Critical'],'Critical'),
      mc('o32-2','Risk rating in a pen test is typically based on:',['Time to exploit','Combination of likelihood and business impact','Tool vendor rating','Number of CVEs found'],'Combination of likelihood and business impact'),
      tf('o32-3','Remediation verification (re-testing) confirms that fixes were properly implemented.','True'),
      mc('o32-4','The executive summary in a pen test report is intended for:',['Junior developers','The security operations team only','Non-technical decision makers and management','The penetration tester\'s own records'],'Non-technical decision makers and management'),
    ]));
    insertLesson.run(L('l8-2-2','m8-2','8',2,'Post-Exploitation and Reporting',
      'Post-exploitation activities — privilege escalation, lateral movement, and persistence — demonstrate the true impact of a compromise. Ethical testers document all findings without causing damage and then produce a professional report with an executive summary, technical details, risk ratings, and actionable remediation recommendations.',
      ['Post-exploitation goals: escalate privileges, maintain access (within scope), demonstrate impact','Privilege escalation: vertical (user → admin) or horizontal (user → another user\'s access)','Lateral movement: pivoting from one compromised system to others using harvested credentials','Documentation during testing: screenshots, command output, timestamps — critical for the report','Report structure: Executive Summary (for mgmt) + Technical Findings (for IT) + Remediation Roadmap'],
      ['https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800'],
      'pre-l8-2-2','post-l8-2-2',45));

    db.exec('COMMIT');
    console.log('[DB] Lesson content seeded (courses 5-8). Total: 32 lessons, 64 quizzes.');
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('[DB] Lesson content seed (courses 5-8) failed:', err);
  }
};
