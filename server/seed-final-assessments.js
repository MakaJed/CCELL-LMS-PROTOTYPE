// seed-final-assessments.js — Pre-made Final Assessments for all 8 courses.
// Skips if final assessments already exist.

module.exports = function seedFinalAssessments(db) {
  const existing = db.prepare("SELECT COUNT(*) as c FROM quizzes WHERE assessment_type = 'final_assessment'").get().c;
  if (existing >= 8) return;

  console.log('[DB] Seeding final assessments for all courses...');

  const insertQuiz = db.prepare(`
    INSERT OR IGNORE INTO quizzes
      (id, course_id, title, passing_score, time_limit, allow_retakes, max_retake_attempts, assessment_type, questions)
    VALUES
      (@id, @course_id, @title, 80, 30, 1, 3, 'final_assessment', @questions)
  `);

  function mc(id, q, opts, ans) {
    return { id, type: 'multiple_choice', question: q, options: opts, correct_answer: ans, points: 10 };
  }
  function tf(id, q, ans) {
    return { id, type: 'true_false', question: q, options: ['True', 'False'], correct_answer: ans, points: 10 };
  }

  const courses = [
    {
      id: 'fa-1', course_id: '1',
      title: 'Introduction to Cybersecurity — Final Assessment',
      questions: [
        mc('fa1-q1', 'What does the CIA Triad stand for?',
          ['Confidentiality, Integrity, Availability', 'Control, Identity, Access', 'Cryptography, Intrusion, Audit', 'Certification, Infrastructure, Authorization'],
          'Confidentiality, Integrity, Availability'),
        tf('fa1-q2', 'Phishing is a type of social engineering attack.', 'True'),
        mc('fa1-q3', 'Which protocol encrypts data transmitted over the web?',
          ['HTTP', 'FTP', 'HTTPS', 'SMTP'], 'HTTPS'),
        tf('fa1-q4', 'A firewall can completely prevent all cyberattacks.', 'False'),
        mc('fa1-q5', 'What is the purpose of a VPN?',
          ['Speed up internet connection', 'Create a secure encrypted tunnel over public networks', 'Block malicious websites', 'Monitor network traffic'],
          'Create a secure encrypted tunnel over public networks'),
        mc('fa1-q6', 'Which attack involves flooding a server with traffic to make it unavailable?',
          ['Phishing', 'Man-in-the-Middle', 'Denial of Service (DoS)', 'SQL Injection'],
          'Denial of Service (DoS)'),
        tf('fa1-q7', 'Multi-factor authentication improves account security.', 'True'),
        mc('fa1-q8', 'What is a zero-day vulnerability?',
          ['A bug fixed on release day', 'A vulnerability unknown to the software vendor', 'A vulnerability that takes zero days to exploit', 'A network configuration error'],
          'A vulnerability unknown to the software vendor'),
        mc('fa1-q9', 'Which of the following is a best practice for password security?',
          ['Using the same password for all accounts', 'Writing passwords in a sticky note on your monitor', 'Using a unique, complex password for each account', 'Sharing passwords with trusted colleagues'],
          'Using a unique, complex password for each account'),
        tf('fa1-q10', 'Encryption makes data completely unreadable without the correct key.', 'True'),
      ],
    },
    {
      id: 'fa-2', course_id: '2',
      title: 'Digital Marketing Fundamentals — Final Assessment',
      questions: [
        mc('fa2-q1', 'What does SEO stand for?',
          ['Search Engine Optimization', 'Social Engagement Outreach', 'Site Engagement Operation', 'Search Engagement Overview'],
          'Search Engine Optimization'),
        tf('fa2-q2', 'Organic search results are paid placements on search engine results pages.', 'False'),
        mc('fa2-q3', 'Which metric measures the percentage of visitors who leave after viewing one page?',
          ['Click-Through Rate', 'Bounce Rate', 'Conversion Rate', 'Impression Share'],
          'Bounce Rate'),
        mc('fa2-q4', 'What is the primary goal of a Call to Action (CTA)?',
          ['Increase page load speed', 'Prompt the user to take a specific action', 'Improve SEO ranking', 'Reduce ad spend'],
          'Prompt the user to take a specific action'),
        tf('fa2-q5', 'Email marketing has one of the highest ROIs among digital marketing channels.', 'True'),
        mc('fa2-q6', 'Which platform uses hashtags as a primary discovery mechanism?',
          ['LinkedIn', 'Google Ads', 'Instagram', 'Email'],
          'Instagram'),
        mc('fa2-q7', 'PPC stands for:',
          ['Page Per Click', 'Pay Per Click', 'Platform Per Campaign', 'Paid Promo Campaign'],
          'Pay Per Click'),
        tf('fa2-q8', 'Content marketing focuses purely on selling products directly.', 'False'),
        mc('fa2-q9', 'Google Analytics is used to:',
          ['Create email campaigns', 'Design social media graphics', 'Track and analyze website traffic', 'Manage paid advertisements'],
          'Track and analyze website traffic'),
        tf('fa2-q10', 'A/B testing helps determine which version of content performs better.', 'True'),
      ],
    },
    {
      id: 'fa-3', course_id: '3',
      title: 'Data Science with Python — Final Assessment',
      questions: [
        mc('fa3-q1', 'Which Python library is primarily used for data manipulation and analysis?',
          ['NumPy', 'Pandas', 'Matplotlib', 'Scikit-learn'],
          'Pandas'),
        tf('fa3-q2', 'Scikit-learn is a Python library used for machine learning.', 'True'),
        mc('fa3-q3', 'What type of chart is best for showing the distribution of a single numerical variable?',
          ['Bar chart', 'Pie chart', 'Histogram', 'Scatter plot'],
          'Histogram'),
        mc('fa3-q4', 'In supervised learning, the training data:',
          ['Has no labels', 'Contains input-output pairs with labels', 'Is always unlabeled', 'Only contains categorical data'],
          'Contains input-output pairs with labels'),
        tf('fa3-q5', 'Overfitting occurs when a model performs well on training data but poorly on unseen data.', 'True'),
        mc('fa3-q6', 'Which function in Pandas is used to read a CSV file?',
          ['pd.open_csv()', 'pd.read_csv()', 'pd.load_csv()', 'pd.import_csv()'],
          'pd.read_csv()'),
        mc('fa3-q7', 'Which algorithm is commonly used for classification tasks?',
          ['Linear Regression', 'K-Means Clustering', 'Random Forest', 'Principal Component Analysis'],
          'Random Forest'),
        tf('fa3-q8', 'Data cleaning is an optional step in the data science pipeline.', 'False'),
        mc('fa3-q9', 'What does NaN stand for in Python data analysis?',
          ['Negative and Null', 'Not a Number', 'Null and Nothing', 'Numeric Analysis Node'],
          'Not a Number'),
        tf('fa3-q10', 'Matplotlib is used for creating visualizations and charts in Python.', 'True'),
      ],
    },
    {
      id: 'fa-4', course_id: '4',
      title: 'Project Management Professional — Final Assessment',
      questions: [
        mc('fa4-q1', 'What does PMBOK stand for?',
          ['Project Management Body of Knowledge', 'Professional Management Business Overview Kit', 'Project Monitoring and Baseline Operations Kit', 'Process Management Best Operations Knowledge'],
          'Project Management Body of Knowledge'),
        tf('fa4-q2', 'The project charter formally authorizes a project to begin.', 'True'),
        mc('fa4-q3', 'Which project management phase involves monitoring and controlling project work?',
          ['Initiating', 'Planning', 'Executing', 'Monitoring & Controlling'],
          'Monitoring & Controlling'),
        mc('fa4-q4', 'A Work Breakdown Structure (WBS) is used to:',
          ['Track project expenses', 'Decompose project deliverables into smaller components', 'Assign risk probability scores', 'Schedule team meetings'],
          'Decompose project deliverables into smaller components'),
        tf('fa4-q5', 'Scope creep refers to uncontrolled changes or continuous growth in project scope.', 'True'),
        mc('fa4-q6', 'Which document defines project objectives, scope, and stakeholders?',
          ['Risk Register', 'Project Charter', 'Gantt Chart', 'Status Report'],
          'Project Charter'),
        mc('fa4-q7', 'What is the critical path in project scheduling?',
          ['The longest sequence of dependent tasks', 'The most expensive set of tasks', 'Tasks with the highest risk', 'The first tasks to be completed'],
          'The longest sequence of dependent tasks'),
        tf('fa4-q8', 'Agile methodology uses fixed, sequential phases just like the Waterfall model.', 'False'),
        mc('fa4-q9', 'A Risk Register is used to:',
          ['Record project milestones', 'Document identified risks and their responses', 'List all project stakeholders', 'Track team attendance'],
          'Document identified risks and their responses'),
        tf('fa4-q10', 'Stakeholder management involves identifying and communicating with all parties affected by the project.', 'True'),
      ],
    },
    {
      id: 'fa-5', course_id: '5',
      title: 'Web Development Bootcamp — Final Assessment',
      questions: [
        mc('fa5-q1', 'Which language is used to define the structure of a web page?',
          ['CSS', 'JavaScript', 'HTML', 'Python'],
          'HTML'),
        tf('fa5-q2', 'CSS is used to control the visual styling and layout of web pages.', 'True'),
        mc('fa5-q3', 'Which JavaScript keyword is used to declare a constant variable?',
          ['var', 'let', 'const', 'def'],
          'const'),
        mc('fa5-q4', 'What does the DOM stand for?',
          ['Document Object Model', 'Data Object Manager', 'Dynamic Output Module', 'Document Oriented Markup'],
          'Document Object Model'),
        tf('fa5-q5', 'React is a JavaScript library for building user interfaces.', 'True'),
        mc('fa5-q6', 'Which HTTP method is used to retrieve data from a server?',
          ['POST', 'DELETE', 'GET', 'PUT'],
          'GET'),
        mc('fa5-q7', 'What is Node.js?',
          ['A CSS framework', 'A JavaScript runtime for server-side development', 'A relational database', 'A browser extension'],
          'A JavaScript runtime for server-side development'),
        tf('fa5-q8', 'SQL databases store data in JSON format by default.', 'False'),
        mc('fa5-q9', 'Which CSS property controls the space between an element\'s border and its content?',
          ['margin', 'padding', 'border-spacing', 'gap'],
          'padding'),
        tf('fa5-q10', 'Version control systems like Git help track changes in source code.', 'True'),
      ],
    },
    {
      id: 'fa-6', course_id: '6',
      title: 'Financial Literacy for Professionals — Final Assessment',
      questions: [
        mc('fa6-q1', 'What is a budget?',
          ['A list of income sources only', 'A plan for managing income and expenses', 'A type of investment account', 'A government tax document'],
          'A plan for managing income and expenses'),
        tf('fa6-q2', 'Compound interest earns interest on both the principal and accumulated interest.', 'True'),
        mc('fa6-q3', 'Diversification in investing means:',
          ['Putting all money into one asset', 'Spreading investments across different asset types', 'Investing only in stocks', 'Avoiding any form of investment risk'],
          'Spreading investments across different asset types'),
        mc('fa6-q4', 'What is an emergency fund?',
          ['A fund for discretionary spending', 'Money saved for unexpected expenses or job loss', 'A retirement savings account', 'Money set aside for vacations'],
          'Money saved for unexpected expenses or job loss'),
        tf('fa6-q5', 'Credit card debt typically carries higher interest rates than mortgage loans.', 'True'),
        mc('fa6-q6', 'What does ROI stand for?',
          ['Rate of Investment', 'Return on Investment', 'Risk of Inflation', 'Ratio of Income'],
          'Return on Investment'),
        mc('fa6-q7', 'Which of the following is a long-term investment vehicle?',
          ['Savings account', 'Money market fund', 'Government bonds', 'Checking account'],
          'Government bonds'),
        tf('fa6-q8', 'Inflation reduces the purchasing power of money over time.', 'True'),
        mc('fa6-q9', 'The 50/30/20 budgeting rule allocates 20% of income to:',
          ['Wants', 'Needs', 'Savings and debt repayment', 'Entertainment'],
          'Savings and debt repayment'),
        tf('fa6-q10', 'A high credit score always results in lower interest rates on loans.', 'True'),
      ],
    },
    {
      id: 'fa-7', course_id: '7',
      title: 'Cisco CCNA Certification Prep — Final Assessment',
      questions: [
        mc('fa7-q1', 'What does OSI stand for?',
          ['Open Systems Interconnection', 'Operational System Integration', 'Online Server Interface', 'Open Source Infrastructure'],
          'Open Systems Interconnection'),
        tf('fa7-q2', 'A router operates at the Network layer (Layer 3) of the OSI model.', 'True'),
        mc('fa7-q3', 'What is the default subnet mask for a Class C IP address?',
          ['255.0.0.0', '255.255.0.0', '255.255.255.0', '255.255.255.255'],
          '255.255.255.0'),
        mc('fa7-q4', 'Which protocol is used to assign IP addresses automatically?',
          ['DNS', 'DHCP', 'SNMP', 'FTP'],
          'DHCP'),
        tf('fa7-q5', 'A switch operates at the Data Link layer (Layer 2) of the OSI model.', 'True'),
        mc('fa7-q6', 'What does VLAN stand for?',
          ['Virtual Local Area Network', 'Variable Length Address Network', 'Verified LAN Access Node', 'Virtual Link Aggregation Network'],
          'Virtual Local Area Network'),
        mc('fa7-q7', 'Which routing protocol uses the Shortest Path First (SPF) algorithm?',
          ['RIP', 'BGP', 'OSPF', 'EIGRP'],
          'OSPF'),
        tf('fa7-q8', 'NAT (Network Address Translation) allows multiple devices to share a single public IP address.', 'True'),
        mc('fa7-q9', 'Which layer of the OSI model is responsible for end-to-end communication?',
          ['Data Link', 'Network', 'Transport', 'Session'],
          'Transport'),
        tf('fa7-q10', 'TCP is a connection-oriented protocol that guarantees packet delivery.', 'True'),
      ],
    },
    {
      id: 'fa-8', course_id: '8',
      title: 'Ethical Hacking & Penetration Testing — Final Assessment',
      questions: [
        mc('fa8-q1', 'What is the first phase of a penetration test?',
          ['Exploitation', 'Reconnaissance', 'Reporting', 'Post-Exploitation'],
          'Reconnaissance'),
        tf('fa8-q2', 'Ethical hacking requires explicit written permission from the target organization.', 'True'),
        mc('fa8-q3', 'Which tool is commonly used for network scanning and host discovery?',
          ['Wireshark', 'Metasploit', 'Nmap', 'Burp Suite'],
          'Nmap'),
        mc('fa8-q4', 'What is a buffer overflow attack?',
          ['Overloading a server with excessive requests', 'Writing more data to a buffer than it can hold, causing code execution', 'Intercepting network packets', 'Cracking password hashes'],
          'Writing more data to a buffer than it can hold, causing code execution'),
        tf('fa8-q5', 'Social engineering exploits human psychology rather than technical vulnerabilities.', 'True'),
        mc('fa8-q6', 'Which type of penetration test gives the tester no prior knowledge of the target system?',
          ['White-box testing', 'Gray-box testing', 'Black-box testing', 'Crystal-box testing'],
          'Black-box testing'),
        mc('fa8-q7', 'What does SQL Injection exploit?',
          ['Misconfigured firewalls', 'Improperly sanitized user inputs in database queries', 'Weak encryption algorithms', 'Outdated SSL certificates'],
          'Improperly sanitized user inputs in database queries'),
        tf('fa8-q8', 'A penetration tester should always clean up all traces and tools after completing an engagement.', 'True'),
        mc('fa8-q9', 'What is the purpose of a penetration test report?',
          ['To publish vulnerabilities publicly', 'To document findings, risks, and recommendations for remediation', 'To provide legal protection only', 'To train junior developers'],
          'To document findings, risks, and recommendations for remediation'),
        tf('fa8-q10', 'Cross-Site Scripting (XSS) injects malicious scripts into web pages viewed by other users.', 'True'),
      ],
    },
  ];

  db.exec('BEGIN');
  try {
    for (const c of courses) {
      insertQuiz.run({
        id: c.id,
        course_id: c.course_id,
        title: c.title,
        questions: JSON.stringify(c.questions),
      });
    }
    db.exec('COMMIT');
    console.log('[DB] Final assessments seeded for all 8 courses.');
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('[DB] Final assessment seed failed:', err);
  }
};
