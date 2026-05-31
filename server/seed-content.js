// seed-content.js — Populates all 8 courses with modules, lessons, and quizzes.
// Runs only when lessons count < 30 (safe to re-run on fresh DB or after clearing content).

module.exports = function seedContent(db) {
  const lessonCount = db.prepare('SELECT COUNT(*) as c FROM lessons').get().c;
  if (lessonCount >= 30) return;

  console.log('[DB] Seeding lesson content for all courses...');

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

  // extra_media_url pool — YouTube embeds (view-only, no download)
  const EXTRA_MEDIA = [
    'https://www.youtube.com/embed/inWWhr5tnEA', // Cybersecurity overview
    'https://www.youtube.com/embed/AQDCe585Lnc', // Network basics
    'https://www.youtube.com/embed/x5EA8r5Tgm8', // Digital marketing
    'https://www.youtube.com/embed/7Em89bJEFxQ', // Python programming
    'https://www.youtube.com/embed/0lye_HGn-T4', // Data science intro
    'https://www.youtube.com/embed/rfscVS0vtbw', // Python basics
    'https://www.youtube.com/embed/3N3n9wgM9Zs', // Web design
    'https://www.youtube.com/embed/IEEhzQoKtQU', // Project management
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

    // ── COURSE 1: Introduction to Cybersecurity ────────────────────────────
    insertModule.run({ id:'m1-1', course_id:'1', title:'Cybersecurity Foundations', description:'Core principles and threat landscape', module_order:1 });
    insertModule.run({ id:'m1-2', course_id:'1', title:'Network Security', description:'Defending networks and data in transit', module_order:2 });

    insertQuiz.run(Q('pre-l1-1-1','m1-1','1','CIA Triad Pre-Test','pre_test',[
      mc('p1-1','What does CIA stand for in cybersecurity?',['Confidentiality, Integrity, Availability','Cyber Intelligence Agency','Classified Information Access','Control, Inspect, Audit'],'Confidentiality, Integrity, Availability'),
      mc('p1-2','Which of these is NOT a type of malware?',['Virus','Ransomware','Firewall','Trojan'],'Firewall'),
      tf('p1-3','A firewall blocks unauthorized network access.','True'),
      mc('p1-4','Which attack tricks users into revealing sensitive information?',['DDoS','Phishing','SQL Injection','Man-in-the-Middle'],'Phishing'),
    ]));
    insertQuiz.run(Q('post-l1-1-1','m1-1','1','CIA Triad Post-Test','post_test',[
      mc('o1-1','Which CIA principle ensures data is accurate and unaltered?',['Confidentiality','Integrity','Availability','Authentication'],'Integrity'),
      mc('o1-2','What attack floods a server to deny service?',['Phishing','SQL Injection','DDoS','Ransomware'],'DDoS'),
      tf('o1-3','Zero-day vulnerabilities are known and patched exploits.','False'),
      mc('o1-4','Which framework provides a voluntary cybersecurity standard?',['OWASP','NIST CSF','ISO 9001','PCI DSS'],'NIST CSF'),
    ]));
    insertLesson.run(L('l1-1-1','m1-1','1',1,'What is Cybersecurity?',
      'Cybersecurity protects systems, networks, and programs from digital attacks. The CIA Triad — Confidentiality, Integrity, and Availability — is the cornerstone of every security strategy. As the digital world expands, cybersecurity has become a critical professional skill across all industries.',
      ['CIA Triad: Confidentiality (only authorized access), Integrity (data accuracy), Availability (reliable access)','Cyber threats include malware, phishing, social engineering, and ransomware','Cybersecurity applies to hardware, software, networks, and human behavior','Defense-in-depth: multiple overlapping security layers to slow attackers','Risk = Threat × Vulnerability × Impact — all three must be addressed'],
      ['https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800','https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800'],
      'pre-l1-1-1','post-l1-1-1',25));

    insertQuiz.run(Q('pre-l1-1-2','m1-1','1','Cyber Threats Pre-Test','pre_test',[
      mc('p2-1','Which malware encrypts files and demands payment?',['Virus','Spyware','Ransomware','Adware'],'Ransomware'),
      mc('p2-2','What is social engineering?',['Hacking software','Manipulating people to reveal information','Network packet analysis','Brute-force cracking'],'Manipulating people to reveal information'),
      tf('p2-3','Insider threats only come from malicious employees.','False'),
      mc('p2-4','Which attack intercepts communication between two parties?',['DDoS','Man-in-the-Middle','Phishing','SQL Injection'],'Man-in-the-Middle'),
    ]));
    insertQuiz.run(Q('post-l1-1-2','m1-1','1','Cyber Threats Post-Test','post_test',[
      mc('o2-1','A worm differs from a virus because it:',['Deletes files','Self-replicates without a host file','Requires user interaction','Only infects emails'],'Self-replicates without a host file'),
      mc('o2-2','Best defense against phishing?',['Antivirus software','User awareness training','Stronger passwords','Network firewall'],'User awareness training'),
      tf('o2-3','APT stands for Advanced Persistent Threat.','True'),
      mc('o2-4','Which vulnerability is unknown to the software vendor?',['Buffer overflow','SQL injection','Zero-day','Cross-site scripting'],'Zero-day'),
    ]));
    insertLesson.run(L('l1-1-2','m1-1','1',2,'Common Cyber Threats',
      'The threat landscape constantly evolves. Attackers use malware (viruses, worms, ransomware), social engineering, man-in-the-middle attacks, and zero-day exploits. Understanding each threat type helps organizations build layered defenses addressing both technical and human vulnerabilities.',
      ['Malware types: virus (needs host), worm (self-replicates), trojan (disguised), ransomware (encrypts data for ransom)','Social engineering exploits human psychology rather than software flaws','Man-in-the-Middle attacks intercept communications in transit','Zero-day vulnerabilities have no patch available when discovered','Defense-in-depth: layered controls across people, process, and technology'],
      ['https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800','https://images.unsplash.com/photo-1518770660439-4636190af475?w=800'],
      'pre-l1-1-2','post-l1-1-2',30));

    insertQuiz.run(Q('pre-l1-2-1','m1-2','1','Firewall Pre-Test','pre_test',[
      mc('p3-1','Primary function of a firewall?',['Speed up network','Encrypt data','Filter network traffic','Backup data'],'Filter network traffic'),
      mc('p3-2','Which firewall examines each packet without context?',['Stateful','Application-layer','Packet filtering','Next-generation'],'Packet filtering'),
      tf('p3-3','A DMZ sits between the trusted internal network and the internet.','True'),
      mc('p3-4','Default HTTPS port?',['80','443','8080','22'],'443'),
    ]));
    insertQuiz.run(Q('post-l1-2-1','m1-2','1','Firewall Post-Test','post_test',[
      mc('o3-1','Stateful firewalls track active connections using:',['Packet headers only','Connection state tables','DNS records','IP reputation lists'],'Connection state tables'),
      mc('o3-2','IDS stands for:',['Internet Defense System','Intrusion Detection System','Internal Data Security','Integrated Defense Shield'],'Intrusion Detection System'),
      tf('o3-3','An IPS can actively block malicious traffic while an IDS only monitors.','True'),
      mc('o3-4','Which network zone is accessible from both internal and external networks?',['LAN','WAN','DMZ','VPN'],'DMZ'),
    ]));
    insertLesson.run(L('l1-2-1','m1-2','1',1,'Firewalls and Network Defense',
      'Firewalls enforce access control between trusted internal networks and untrusted external ones. Modern next-generation firewalls (NGFW) add deep packet inspection, application awareness, and integrated intrusion prevention. Combining firewalls with IDS/IPS and DMZ architecture provides robust perimeter defense.',
      ['Packet filtering: checks source/destination IP and port — fast but context-blind','Stateful inspection: tracks connection state for smarter, context-aware decisions','Application-layer gateway: inspects payload content for application-level threats','DMZ isolates public-facing servers (web, mail) from the internal network','IDS monitors traffic passively; IPS actively blocks detected threats in real time'],
      ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800'],
      'pre-l1-2-1','post-l1-2-1',35));

    insertQuiz.run(Q('pre-l1-2-2','m1-2','1','Encryption Pre-Test','pre_test',[
      mc('p4-1','Which encryption uses the same key for both encrypt and decrypt?',['Asymmetric','Symmetric','Hashing','Steganography'],'Symmetric'),
      mc('p4-2','PKI stands for:',['Private Key Infrastructure','Public Key Infrastructure','Protected Key Index','Packet Key Integration'],'Public Key Infrastructure'),
      tf('p4-3','TLS encrypts data in transit over the internet.','True'),
      mc('p4-4','Common algorithm for asymmetric encryption?',['AES','DES','RSA','MD5'],'RSA'),
    ]));
    insertQuiz.run(Q('post-l1-2-2','m1-2','1','Encryption Post-Test','post_test',[
      mc('o4-1','A VPN creates a secure tunnel using:',['Compression','Encryption and tunneling protocols','DNS resolution','Load balancing'],'Encryption and tunneling protocols'),
      mc('o4-2','Widely-used symmetric encryption standard today:',['RSA','ECC','AES','SHA-256'],'AES'),
      tf('o4-3','Digital certificates verify the identity of websites and services.','True'),
      mc('o4-4','Purpose of a Certificate Authority (CA)?',['Generate passwords','Sign and validate digital certificates','Monitor traffic','Block malware'],'Sign and validate digital certificates'),
    ]));
    insertLesson.run(L('l1-2-2','m1-2','1',2,'Encryption and VPNs',
      'Encryption converts plaintext into unreadable ciphertext. Symmetric encryption uses one shared key (AES); asymmetric uses a public/private key pair (RSA). VPNs leverage encryption to create secure tunnels over public networks, ensuring confidentiality and integrity of data in transit.',
      ['Symmetric: one key for both encryption and decryption — AES is the gold standard','Asymmetric: public key encrypts, private key decrypts — solves key distribution problem','TLS/SSL secures HTTPS using a hybrid approach: asymmetric for handshake, symmetric for data','PKI manages digital certificates to authenticate identities in communications','VPNs tunnel encrypted traffic over untrusted networks using protocols like IPSec or OpenVPN'],
      ['https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=800'],
      'pre-l1-2-2','post-l1-2-2',35));

    // ── COURSE 2: Digital Marketing Fundamentals ───────────────────────────
    insertModule.run({ id:'m2-1', course_id:'2', title:'Search Engine Optimization', description:'Driving organic traffic through SEO', module_order:1 });
    insertModule.run({ id:'m2-2', course_id:'2', title:'Social Media & Content Marketing', description:'Building brand presence and measuring results', module_order:2 });

    insertQuiz.run(Q('pre-l2-1-1','m2-1','2','SEO Basics Pre-Test','pre_test',[
      mc('p5-1','What does SEO stand for?',['Search Engine Optimization','Social Engagement Outreach','Site Engagement Operations','Search Entry Options'],'Search Engine Optimization'),
      mc('p5-2','Which does NOT directly affect SEO?',['Page loading speed','Number of backlinks','Website color scheme','Mobile responsiveness'],'Website color scheme'),
      tf('p5-3','Keyword stuffing improves search engine rankings.','False'),
      mc('p5-4','SERP stands for?',['Social Engagement Rate Page','Search Engine Results Page','Site Error Report Panel','Search Entry Ranking Position'],'Search Engine Results Page'),
    ]));
    insertQuiz.run(Q('post-l2-1-1','m2-1','2','SEO Basics Post-Test','post_test',[
      mc('o5-1','Most important HTML tag for on-page SEO?',['<div>','<span>','<title>','<header>'],'<title>'),
      mc('o5-2','Backlinks are:',['Internal page links','Links from other websites pointing to yours','Broken links','Navigation menu links'],'Links from other websites pointing to yours'),
      tf('o5-3','A sitemap helps search engines crawl and index a website.','True'),
      mc('o5-4','Purpose of meta descriptions?',['Improve page speed','Show a brief summary in search results','Increase security','Add hidden keywords'],'Show a brief summary in search results'),
    ]));
    insertLesson.run(L('l2-1-1','m2-1','2',1,'Introduction to SEO',
      'Search Engine Optimization (SEO) improves website visibility in organic search results. It involves technical optimization, on-page content quality, and off-page authority building. SEO drives free, long-term traffic from users actively searching for your content.',
      ['SEO pillars: Technical (site speed, crawlability), On-Page (content, keywords), Off-Page (backlinks)','Search engines: crawl → index → rank pages based on relevance and authority','Keyword research identifies terms your audience searches for — use Google Keyword Planner','Page titles, meta descriptions, and H1-H6 headers are critical on-page signals','Domain authority builds over time through quality backlinks from reputable sources'],
      ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800','https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800'],
      'pre-l2-1-1','post-l2-1-1',25));

    insertQuiz.run(Q('pre-l2-1-2','m2-1','2','On-Page SEO Pre-Test','pre_test',[
      mc('p6-1','Recommended meta description length?',['50-80 chars','150-160 chars','250-300 chars','400-500 chars'],'150-160 chars'),
      mc('p6-2','Heading tag for main page title?',['H2','H3','H1','H4'],'H1'),
      tf('p6-3','Image alt text helps both accessibility and SEO.','True'),
      mc('p6-4','What does a canonical tag do?',['Speeds page loading','Tells search engines the preferred URL for duplicate content','Adds keywords to images','Creates a sitemap'],'Tells search engines the preferred URL for duplicate content'),
    ]));
    insertQuiz.run(Q('post-l2-1-2','m2-1','2','On-Page SEO Post-Test','post_test',[
      mc('o6-1','Internal linking benefits SEO because:',['Increases file size','Helps search engines understand site structure and distribute link equity','Reduces mobile speed','Hides duplicate content'],'Helps search engines understand site structure and distribute link equity'),
      mc('o6-2','Keyword density means:',['Keywords per page','Percentage of times a keyword appears relative to total word count','Cost per keyword in ads','Backlinks for a keyword'],'Percentage of times a keyword appears relative to total word count'),
      tf('o6-3','Page loading speed is a confirmed Google ranking factor.','True'),
      mc('o6-4','LSI keywords refer to:',['Long-tail Search Index','Latent Semantic Indexing — related/contextual keywords','Local SEO Integration','Link Strength Indicator'],'Latent Semantic Indexing — related/contextual keywords'),
    ]));
    insertLesson.run(L('l2-1-2','m2-1','2',2,'On-Page Optimization Techniques',
      'On-page SEO optimizes individual web pages for specific keywords and user intent. Title tags, headers, meta descriptions, image alt text, and internal links work together to signal relevance to search engines. Content quality and search intent alignment are the most powerful on-page factors.',
      ['Title tags: 50-60 characters, include primary keyword near the beginning','One H1 per page — the most important heading; use H2/H3 for subheadings','Meta descriptions (150-160 chars) do not directly affect ranking but improve click-through rate','Image alt text: describes image content for both search engines and screen readers','Internal linking distributes page authority and guides users through related content'],
      ['https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800'],
      'pre-l2-1-2','post-l2-1-2',30));

    insertQuiz.run(Q('pre-l2-2-1','m2-2','2','Social Media Pre-Test','pre_test',[
      mc('p7-1','Which metric measures percentage who clicked a link after seeing it?',['Impressions','Click-Through Rate (CTR)','Engagement Rate','Reach'],'Click-Through Rate (CTR)'),
      mc('p7-2','Content type with highest organic reach on social media?',['Text-only posts','Stock images','Native video','PDF documents'],'Native video'),
      tf('p7-3','Posting consistently improves social media algorithm performance.','True'),
      mc('p7-4','A content calendar is:',['An automation tool','A planned schedule of content topics, formats, and publishing times','A paid advertising platform','A follower dashboard'],'A planned schedule of content topics, formats, and publishing times'),
    ]));
    insertQuiz.run(Q('post-l2-2-1','m2-2','2','Social Media Post-Test','post_test',[
      mc('o7-1','Engagement rate is measured as:',['Total followers','(Likes+Comments+Shares) ÷ Followers × 100','Posts per week','Ad spend ÷ reach'],'(Likes+Comments+Shares) ÷ Followers × 100'),
      mc('o7-2','A/B testing in social media involves:',['Testing two content versions to see which performs better','Running paid and organic posts together','Analyzing competitors','Scheduling at different times'],'Testing two content versions to see which performs better'),
      tf('o7-3','Hashtags are only relevant on Instagram and Twitter/X.','False'),
      mc('o7-4','Reach measures:',['Number of clicks','Unique users who saw your content','Total followers','Cost per thousand impressions'],'Unique users who saw your content'),
    ]));
    insertLesson.run(L('l2-2-1','m2-2','2',1,'Social Media Strategy',
      'Social media marketing builds brand awareness and community. Each platform has strengths: Facebook for community/ads, Instagram for visual storytelling, LinkedIn for B2B, TikTok/YouTube for video. A winning strategy identifies the right audience, selects appropriate platforms, and delivers consistent valuable content.',
      ['Identify your target audience before choosing platforms — demographics, interests, behaviors','80/20 content rule: 80% educational/entertaining, 20% promotional','Consistency in posting schedule and brand voice builds algorithmic favor and trust','Engagement rate (not follower count) is the true measure of social media health','Platform-native content performs best — repurposing without adaptation hurts reach'],
      ['https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=800'],
      'pre-l2-2-1','post-l2-2-1',30));

    insertQuiz.run(Q('pre-l2-2-2','m2-2','2','Content Marketing Pre-Test','pre_test',[
      mc('p8-1','Primary goal of content marketing?',['Immediate sales','Building long-term audience trust and value','Replacing paid ads','Technical SEO only'],'Building long-term audience trust and value'),
      mc('p8-2','ROI stands for:',['Return on Investment','Rate of Interaction','Reach of Impressions','Revenue Over Income'],'Return on Investment'),
      tf('p8-3','A buyer persona is a fictional representation of your ideal customer.','True'),
      mc('p8-4','Most common tool to measure website traffic?',['Facebook Insights','Google Analytics','Instagram Analytics','Twitter Analytics'],'Google Analytics'),
    ]));
    insertQuiz.run(Q('post-l2-2-2','m2-2','2','Content Marketing Post-Test','post_test',[
      mc('o8-1','A conversion in digital marketing is:',['A new follower','When a visitor completes a desired action (purchase, sign-up)','A page view','An ad impression'],'When a visitor completes a desired action (purchase, sign-up)'),
      mc('o8-2','Top of the marketing funnel is called:',['Conversion','Retention','Awareness','Decision'],'Awareness'),
      tf('o8-3','Email marketing delivers among the highest ROI of digital channels.','True'),
      mc('o8-4','CPC stands for:',['Cost Per Click','Content Per Campaign','Clicks Per Customer','Cost Per Conversion'],'Cost Per Click'),
    ]));
    insertLesson.run(L('l2-2-2','m2-2','2',2,'Content Creation and Analytics',
      'Content marketing attracts and retains audiences through valuable content. Success requires measuring performance: Google Analytics reveals traffic sources and conversion goals, platform insights show content resonance, and CRM tools track the full customer journey. Always tie content efforts to measurable business outcomes.',
      ['Content types: blogs, videos, infographics, podcasts, webinars, email newsletters','Buyer journey: Awareness → Consideration → Decision — match content to each stage','Google Analytics: track traffic sources, bounce rate, time on page, and conversion goals','Email marketing delivers ~$36 ROI for every $1 spent — highest among digital channels','Set SMART goals: Specific, Measurable, Achievable, Relevant, Time-bound'],
      ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800'],
      'pre-l2-2-2','post-l2-2-2',30));

    // ── COURSE 3: Data Science with Python ────────────────────────────────
    insertModule.run({ id:'m3-1', course_id:'3', title:'Python for Data Analysis', description:'NumPy, Pandas, and exploratory data analysis', module_order:1 });
    insertModule.run({ id:'m3-2', course_id:'3', title:'Machine Learning Fundamentals', description:'Supervised learning and model evaluation', module_order:2 });

    insertQuiz.run(Q('pre-l3-1-1','m3-1','3','Python Libraries Pre-Test','pre_test',[
      mc('p9-1','Foundation library for numerical computing in Python?',['Pandas','Matplotlib','NumPy','Scikit-learn'],'NumPy'),
      mc('p9-2','A Pandas DataFrame is:',['A chart type','A 2D labeled data structure with columns of potentially different types','An ML model','A visualization class'],'A 2D labeled data structure with columns of potentially different types'),
      tf('p9-3','Python lists and NumPy arrays are functionally identical for data science.','False'),
      mc('p9-4','Pandas method to remove rows with missing values?',['dropna()','fillna()','removenull()','clean()'],'dropna()'),
    ]));
    insertQuiz.run(Q('post-l3-1-1','m3-1','3','Python Libraries Post-Test','post_test',[
      mc('o9-1','What does df.describe() return?',['Column names only','Statistical summary of numeric columns','First 5 rows','Data types of all columns'],'Statistical summary of numeric columns'),
      mc('o9-2','Pandas method to merge two DataFrames on a key?',['concat()','merge()','append()','insert()'],'merge()'),
      tf('o9-3','NumPy broadcasting allows operations on arrays of different shapes.','True'),
      mc('o9-4','EDA (Exploratory Data Analysis) means:',['Building ML models','Analyzing datasets to summarize characteristics before modeling','Deploying models','Writing SQL queries'],'Analyzing datasets to summarize characteristics before modeling'),
    ]));
    insertLesson.run(L('l3-1-1','m3-1','3',1,'Python Data Structures and Libraries',
      'Python dominates data science due to its readability and powerful ecosystem. NumPy provides efficient multi-dimensional arrays for numerical computation. Pandas extends this with labeled DataFrames for tabular data. Matplotlib and Seaborn handle visualization. Together these form the core data science stack.',
      ['NumPy arrays outperform Python lists for numerical operations via vectorization','Pandas DataFrames: 2D tables with labeled rows (index) and columns — ideal for tabular data','Key Pandas operations: read_csv, head/tail, describe, groupby, merge, pivot_table','Missing data: dropna() removes rows; fillna() replaces nulls with specified values','Always begin EDA with .shape, .info(), .describe(), and .value_counts()'],
      ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800','https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800'],
      'pre-l3-1-1','post-l3-1-1',40));

    insertQuiz.run(Q('pre-l3-1-2','m3-1','3','Data Cleaning Pre-Test','pre_test',[
      mc('p10-1','Purpose of data normalization?',['Removing duplicates','Scaling features to a common range','Filling missing values','Encoding categoricals'],'Scaling features to a common range'),
      mc('p10-2','Pandas method to detect missing values?',['isnull()','missing()','notfound()','checkna()'],'isnull()'),
      tf('p10-3','Outliers should always be removed from a dataset.','False'),
      mc('p10-4','One-hot encoding does what?',['Scales numeric features','Converts categorical variables into binary columns','Removes duplicates','Sorts data'],'Converts categorical variables into binary columns'),
    ]));
    insertQuiz.run(Q('post-l3-1-2','m3-1','3','Data Cleaning Post-Test','post_test',[
      mc('o10-1','Best chart to show distribution of a single numeric variable?',['Bar chart','Scatter plot','Histogram','Line chart'],'Histogram'),
      mc('o10-2','Feature engineering is:',['Selecting an ML algorithm','Creating new features from existing data to improve model performance','Cleaning missing values','Splitting data'],'Creating new features from existing data to improve model performance'),
      tf('o10-3','A correlation coefficient of -1 indicates perfect negative linear relationship.','True'),
      mc('o10-4','Train-test split is used for:',['Feature engineering','Evaluating model performance on unseen data','Visualization','Removing outliers'],'Evaluating model performance on unseen data'),
    ]));
    insertLesson.run(L('l3-1-2','m3-1','3',2,'Data Cleaning and Exploration',
      'Real-world data is messy — missing values, duplicates, outliers, and inconsistent formats. Data cleaning is often 80% of a data scientist\'s work. EDA uses statistics and visualizations to discover patterns and anomalies before building any model.',
      ['Data cleaning: handle nulls, remove duplicates, fix dtypes, address outliers','Normalization (0-1 scale) vs Standardization (mean=0, std=1) — choose based on algorithm','One-hot encoding converts categorical data to binary columns for ML algorithms','Correlation matrix reveals linear relationships between numeric variables','EDA visuals: histograms (distribution), box plots (outliers), scatter plots (relationships)'],
      ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800'],
      'pre-l3-1-2','post-l3-1-2',45));

    insertQuiz.run(Q('pre-l3-2-1','m3-2','3','ML Basics Pre-Test','pre_test',[
      mc('p11-1','Which ML type uses labeled training data?',['Unsupervised','Reinforcement','Supervised','Semi-supervised'],'Supervised'),
      mc('p11-2','What does a decision tree split on?',['Random features','The feature minimizing impurity most','The last feature alphabetically','The most correlated feature'],'The feature minimizing impurity most'),
      tf('p11-3','Overfitting occurs when a model performs well on training data but poorly on new data.','True'),
      mc('p11-4','Purpose of cross-validation?',['Speed up training','Visualize data','Estimate how well the model generalizes','Remove outliers'],'Estimate how well the model generalizes'),
    ]));
    insertQuiz.run(Q('post-l3-2-1','m3-2','3','ML Basics Post-Test','post_test',[
      mc('o11-1','An ensemble of decision trees is called:',['Linear Regression','Random Forest','K-Nearest Neighbors','SVM'],'Random Forest'),
      mc('o11-2','Regularization in ML prevents:',['Computation speed issues','Data noise','Overfitting by penalizing complexity','Underfitting'],'Overfitting by penalizing complexity'),
      tf('o11-3','K-Means is a supervised learning algorithm.','False'),
      mc('o11-4','Which metric is best for imbalanced classification datasets?',['Accuracy','F1-Score','Training loss','R-squared'],'F1-Score'),
    ]));
    insertLesson.run(L('l3-2-1','m3-2','3',1,'Supervised Learning Algorithms',
      'Supervised learning trains models on labeled input-output pairs to predict outputs for new inputs. Key algorithms: Linear Regression (continuous output), Logistic Regression (binary classification), Decision Trees, and Random Forest (ensemble). Models are evaluated on a held-out test set to assess generalization.',
      ['Regression predicts continuous values; Classification predicts discrete categories','Decision trees split on features to minimize impurity (Gini index or entropy)','Random Forest: ensemble of trees with random feature sampling — reduces overfitting via averaging','Bias-variance tradeoff: high bias = underfitting; high variance = overfitting','Train/validation/test split ensures fair evaluation — never evaluate on training data'],
      ['https://images.unsplash.com/photo-1527474305487-b87b222841cc?w=800'],
      'pre-l3-2-1','post-l3-2-1',50));

    insertQuiz.run(Q('pre-l3-2-2','m3-2','3','Model Evaluation Pre-Test','pre_test',[
      mc('p12-1','A confusion matrix shows:',['Model training speed','True/false positives and negatives','Feature importance','Variable correlations'],'True/false positives and negatives'),
      mc('p12-2','Precision is defined as:',['TP/(TP+FN)','TP/(TP+FP)','(TP+TN)/Total','FP/(FP+TN)'],'TP/(TP+FP)'),
      tf('p12-3','A high AUC-ROC score indicates a better classifier.','True'),
      mc('p12-4','RMSE measures:',['Classification accuracy','Average magnitude of prediction errors','Model training time','Feature correlation'],'Average magnitude of prediction errors'),
    ]));
    insertQuiz.run(Q('post-l3-2-2','m3-2','3','Model Evaluation Post-Test','post_test',[
      mc('o12-1','F1-score is the harmonic mean of:',['Precision and Recall','Accuracy and Loss','Training and Test scores','AUC and ROC'],'Precision and Recall'),
      mc('o12-2','Hyperparameter tuning means:',['Cleaning training data','Searching for optimal model configuration','Removing outliers','Visualizing predictions'],'Searching for optimal model configuration'),
      tf('o12-3','Grid search exhaustively tries all specified hyperparameter combinations.','True'),
      mc('o12-4','Technique to select most informative features?',['Data augmentation','Feature selection','Normalization','Cross-validation'],'Feature selection'),
    ]));
    insertLesson.run(L('l3-2-2','m3-2','3',2,'Model Evaluation and Tuning',
      'After training a model, evaluation metrics reveal real-world performance. Classification uses accuracy, precision, recall, F1-score, and AUC-ROC. Regression uses MAE, MSE, and RMSE. Hyperparameter tuning (Grid Search, Random Search) and cross-validation refine models to optimal configurations.',
      ['Confusion matrix: TP, TN, FP, FN — the foundation of all classification metrics','Precision: of all predicted positives, how many were actually positive?','Recall (Sensitivity): of all actual positives, how many did the model find?','F1-score balances precision and recall — best for imbalanced class datasets','Use GridSearchCV or RandomizedSearchCV from scikit-learn for hyperparameter tuning'],
      ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800'],
      'pre-l3-2-2','post-l3-2-2',45));

    // ── COURSE 4: Project Management Professional ──────────────────────────
    insertModule.run({ id:'m4-1', course_id:'4', title:'Project Foundations & PMBOK', description:'Frameworks, initiation, and planning', module_order:1 });
    insertModule.run({ id:'m4-2', course_id:'4', title:'Execution, Monitoring & Closure', description:'Risk, quality, and stakeholder management', module_order:2 });

    insertQuiz.run(Q('pre-l4-1-1','m4-1','4','PMBOK Pre-Test','pre_test',[
      mc('p13-1','PMBOK stands for:',['Project Management Body of Knowledge','Project Monitoring Best Operations Kit','Professional Management Business Operations Key','Program Management Business Outline'],'Project Management Body of Knowledge'),
      mc('p13-2','A project is best defined as:',['Ongoing operations','A temporary endeavor to create a unique product or service','A routine business process','A budget allocation exercise'],'A temporary endeavor to create a unique product or service'),
      tf('p13-3','The project charter formally authorizes a project and grants the PM authority.','True'),
      mc('p13-4','Triple constraint in project management:',['Cost, Risk, Quality','Scope, Schedule, Cost','Time, Team, Technology','Budget, Deadline, Stakeholders'],'Scope, Schedule, Cost'),
    ]));
    insertQuiz.run(Q('post-l4-1-1','m4-1','4','PMBOK Post-Test','post_test',[
      mc('o13-1','Methodology using sprints and iterative delivery?',['Waterfall','PRINCE2','Agile/Scrum','PMBOK Traditional'],'Agile/Scrum'),
      mc('o13-2','In Scrum, who prioritizes the product backlog?',['Scrum Master','Project Sponsor','Product Owner','Development Team'],'Product Owner'),
      tf('o13-3','Agile is best suited for projects with well-defined, unchanging requirements.','False'),
      mc('o13-4','Waterfall methodology is characterized by:',['Iterative sprints','Sequential phases where each phase must complete before the next begins','Daily standups','Continuous delivery'],'Sequential phases where each phase must complete before the next begins'),
    ]));
    insertLesson.run(L('l4-1-1','m4-1','4',1,'PMBOK Guide and Frameworks',
      'The PMBOK Guide is the globally recognized standard for project management. PMBOK 7th edition focuses on 12 principles and 8 performance domains. Methodologies like Agile, Scrum, PRINCE2, and Lean offer tailored approaches for different project contexts. Most organizations use hybrid approaches combining structured planning with adaptive execution.',
      ['PMBOK 7th ed: 12 principles + 8 performance domains (vs 5 process groups in older editions)','Project lifecycle: Initiation → Planning → Execution → Monitoring & Control → Closure','Triple constraint: changes to Scope, Time, or Cost affect the other two — balance is key','Agile: iterative, adaptive, delivers value incrementally — best for evolving requirements','Hybrid: PMBOK for governance + Agile for execution — increasingly common in organizations'],
      ['https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800','https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=800'],
      'pre-l4-1-1','post-l4-1-1',40));

    insertQuiz.run(Q('pre-l4-1-2','m4-1','4','Planning Pre-Test','pre_test',[
      mc('p14-1','WBS stands for:',['Work Breakdown Structure','Weekly Budget Summary','Work Block Schedule','Workflow Balance Sheet'],'Work Breakdown Structure'),
      mc('p14-2','Scheduling tool showing tasks as horizontal bars on a timeline?',['PERT chart','Network diagram','Gantt chart','Kanban board'],'Gantt chart'),
      tf('p14-3','The critical path is the longest sequence of dependent tasks determining project duration.','True'),
      mc('p14-4','Scope creep is:',['Planned scope expansion','Uncontrolled expansion of scope without adjustments to time/cost','Reduction in scope','A risk technique'],'Uncontrolled expansion of scope without adjustments to time/cost'),
    ]));
    insertQuiz.run(Q('post-l4-1-2','m4-1','4','Planning Post-Test','post_test',[
      mc('o14-1','RACI chart defines:',['Risk levels','Roles: Responsible, Accountable, Consulted, Informed per task','Cost estimates','Schedule milestones'],'Roles: Responsible, Accountable, Consulted, Informed per task'),
      mc('o14-2','Earned Value Management (EVM) measures:',['Team satisfaction','Cost and schedule performance vs baseline','Customer requirements','Risk probability'],'Cost and schedule performance vs baseline'),
      tf('o14-3','Float is the amount of time a task can be delayed without delaying the project.','True'),
      mc('o14-4','CPI > 1 in EVM indicates:',['Over budget','Behind schedule','Under budget (cost efficient)','Project cancelled'],'Under budget (cost efficient)'),
    ]));
    insertLesson.run(L('l4-1-2','m4-1','4',2,'Project Initiation and Planning',
      'Successful projects start with solid initiation (Project Charter) and planning (WBS, Gantt chart, Critical Path). The Project Charter formally authorizes the project. The WBS decomposes all deliverables into manageable work packages. The Critical Path Method identifies which tasks directly determine project duration.',
      ['Project Charter: formal authorization — includes objectives, scope, budget, stakeholders, PM authority','WBS breaks all project work into a hierarchy of deliverables and work packages','Gantt chart: horizontal bar chart showing tasks, durations, dependencies, and milestones','Critical Path: longest chain of dependent tasks — has zero float, any delay = project delay','RACI matrix assigns ownership for every task: Responsible, Accountable, Consulted, Informed'],
      ['https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800'],
      'pre-l4-1-2','post-l4-1-2',45));

    insertQuiz.run(Q('pre-l4-2-1','m4-2','4','Risk Management Pre-Test','pre_test',[
      mc('p15-1','Four risk response strategies?',['Avoid, Mitigate, Transfer, Accept','Ignore, Reduce, Remove, Accept','Plan, Execute, Monitor, Close','Identify, Analyze, Respond, Monitor'],'Avoid, Mitigate, Transfer, Accept'),
      mc('p15-2','Risk score is calculated as:',['Risk priority number','Probability × Impact','Risk threshold','Risk matrix cell'],'Probability × Impact'),
      tf('p15-3','A risk register tracks identified risks throughout the project.','True'),
      mc('p15-4','Risk transfer shifts risk to:',['The PM','A third party (insurance, contractor)','The sponsor','The team'],'A third party (insurance, contractor)'),
    ]));
    insertQuiz.run(Q('post-l4-2-1','m4-2','4','Risk Management Post-Test','post_test',[
      mc('o15-1','Contingency reserve is:',['Profit margin','Budget set aside for identified risks','Overhead cost','Team bonuses'],'Budget set aside for identified risks'),
      mc('o15-2','Tornado diagram ranks:',['Project schedule tasks','Risks by their relative impact (sensitivity analysis)','Stakeholder influence','Budget variance'],'Risks by their relative impact (sensitivity analysis)'),
      tf('o15-3','Positive risks (opportunities) should also be actively managed.','True'),
      mc('o15-4','Residual risk is:',['Risk before any controls','Risk that remains after applying response strategies','The highest priority risk','Financial risk only'],'Risk that remains after applying response strategies'),
    ]));
    insertLesson.run(L('l4-2-1','m4-2','4',1,'Risk and Quality Management',
      'Risk management proactively identifies, analyzes, and responds to project uncertainties before they become issues. Quality management ensures deliverables meet requirements through quality planning (setting standards), quality assurance (process audits), and quality control (product inspection).',
      ['Risk identification: brainstorming, SWOT, expert judgment, assumption analysis','Risk matrix: probability vs. impact grid — prioritize high-probability/high-impact risks first','Response strategies: Avoid (eliminate), Mitigate (reduce), Transfer (insure/contract), Accept','Quality planning: define what "done right" looks like before work begins','Cost of Quality: prevention + appraisal costs < internal failure + external failure costs'],
      ['https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=800'],
      'pre-l4-2-1','post-l4-2-1',40));

    insertQuiz.run(Q('pre-l4-2-2','m4-2','4','Stakeholder Pre-Test','pre_test',[
      mc('p16-1','A stakeholder is:',['Only the sponsor','Anyone who affects or is affected by the project','The PM only','External clients only'],'Anyone who affects or is affected by the project'),
      mc('p16-2','Document that formally closes a project?',['Project charter','Lessons learned','Project closure report','Statement of work'],'Project closure report'),
      tf('p16-3','Lessons learned should only be documented at project end.','False'),
      mc('p16-4','Procurement management covers:',['Team performance','Acquiring goods/services from external sources','Budget allocation','Scope documentation'],'Acquiring goods/services from external sources'),
    ]));
    insertQuiz.run(Q('post-l4-2-2','m4-2','4','Stakeholder Post-Test','post_test',[
      mc('o16-1','Stakeholder register contains:',['Project budget','Names, roles, interests, and engagement strategy','Task assignments','Risk details'],'Names, roles, interests, and engagement strategy'),
      mc('o16-2','Primary purpose of lessons learned:',['Legal compliance','Improve future projects by capturing what worked and what did not','Track current issues','Assign blame'],'Improve future projects by capturing what worked and what did not'),
      tf('o16-3','Project closure includes formal acceptance from the customer or sponsor.','True'),
      mc('o16-4','Best communication method for complex sensitive information?',['Mass email','Text message','Formal report plus face-to-face meeting','Social media'],'Formal report plus face-to-face meeting'),
    ]));
    insertLesson.run(L('l4-2-2','m4-2','4',2,'Stakeholder Communication and Closure',
      'Stakeholder management identifies all impacted parties and develops engagement strategies to maintain support. The communication management plan defines who gets what information and when. Project closure includes final acceptance, contract closure, releasing resources, and archiving lessons learned for future projects.',
      ['Stakeholder analysis: identify → assess power/interest → plan engagement strategy','Communication plan: what, to whom, how often, in what format, via what channel','Lessons learned: document throughout the project — not only at the end','Closure checklist: formal acceptance, final report, contract closure, team recognition, archive','Post-project review: measure actual vs. planned cost, schedule, scope, and quality'],
      ['https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800'],
      'pre-l4-2-2','post-l4-2-2',35));

    db.exec('COMMIT');
    console.log('[DB] Lesson content seeded (courses 1-4): 16 lessons, 32 quizzes.');
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('[DB] Lesson content seed failed:', err);
  }
};
