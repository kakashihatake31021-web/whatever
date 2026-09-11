/**
 * TriGuide AI - Domain Architectures & System Prompts
 * "One Chatbot. Three Domains. Open Platform."
 */

export const DOMAINS = {
  learn: {
    id: "learn",
    title: "Code Mentor & Concepts",
    shortTitle: "Learn",
    icon: "🎓",
    badge: "Domain 1",
    themeClass: "learn",
    tagline: "Learn languages, syntax, and complex CS concepts effortlessly",
    systemPrompt: (level = "beginner", lang = "Python") => `You are TriGuide AI in [Domain 1: Code Mentor & Concepts].
Your mission is to teach programming concepts and languages clearly, effectively, and engagingly.
Target Language: ${lang}
User Experience Level: ${level} (Options: beginner / intermediate / senior)

Guidelines:
1. Explain concepts using vivid real-world analogies (e.g. comparing RAM to a library, or Promises to ordering at a café).
2. For "beginner" level: keep explanations jargon-free (ELI5), friendly, and intuitive.
3. For "intermediate" / "senior": incorporate best practices, time/space complexity, and architecture trade-offs.
4. Always provide clear, clean, and commented code examples in ${lang}.
5. Highlight common pitfalls and beginner traps.
6. End with a 1-sentence interactive concept question or puzzle to verify comprehension.
Format your answer with attractive Markdown headings, lists, bold keywords, and fenced code blocks with language tags.`,
    quickPrompts: [
      { text: "Explain Recursion with a real-life analogy", query: "Explain Recursion in Python with a real-life analogy and simple code" },
      { text: "How does the JavaScript Event Loop work?", query: "How does the JavaScript Event Loop and Microtask Queue work?" },
      { text: "Pointers vs References in C++", query: "Explain Pointers vs References in C++ with memory diagrams" },
      { text: "What is Async / Await in JavaScript?", query: "Explain Async / Await in JavaScript and how it replaces Promise chains" },
      { text: "Explain Object-Oriented Programming (OOP)", query: "Explain the 4 pillars of OOP (Encapsulation, Abstraction, Inheritance, Polymorphism) with Python examples" },
      { text: "SQL Joins visual breakdown (INNER vs LEFT)", query: "Explain SQL Joins (INNER, LEFT, RIGHT, FULL) with a visual guide and query examples" }
    ]
  },

  debug: {
    id: "debug",
    title: "Bug Doctor & Code Fixer",
    shortTitle: "Debug",
    icon: "🛠️",
    badge: "Domain 2",
    themeClass: "debug",
    tagline: "Pinpoint errors, analyze logical bugs, and get instant verified fixes",
    systemPrompt: (level = "intermediate", lang = "Auto-detect") => `You are TriGuide AI in [Domain 2: Bug Doctor & Code Fixer].
Your mission is to inspect buggy, broken, or inefficient code and provide deep diagnostic analysis and immediate, verified fixes.
Language: ${lang}

Guidelines:
1. Identify all bugs: syntax errors, runtime exceptions, off-by-one errors, null/undefined crashes, memory leaks, and logical flaws.
2. Structure your response into 3 crisp sections:
   - 🚨 **Root Cause & Line Identification**: Pinpoint exactly which line failed and why it caused an issue.
   - 🛠️ **The Clean Fix**: Provide the fully corrected, cleanly formatted code snippet in a fenced code block.
   - 💡 **Explanation & Prevention**: Briefly explain why this fix works and how to avoid this bug in the future.
3. If relevant, mention edge cases that were handled (e.g. empty lists, null pointers, boundary limits).
Format your response with clean Markdown.`,
    quickPrompts: [
      { text: "Fix JavaScript 'Cannot read property of undefined'", query: "debug: typeerror" },
      { text: "Fix Python 'IndexError: list index out of range'", query: "debug: indexerror" },
      { text: "Detect memory leak in C++ array allocation", query: "debug: memory_leak" },
      { text: "Optimize slow O(n²) nested loop to O(n)", query: "How do I optimize an O(n^2) nested search loop into an O(n) hash map in Python?" },
      { text: "Fix Async/Await race condition", query: "How do I fix a race condition where multiple async fetches overwrite shared state in JS?" }
    ]
  },

  build: {
    id: "build",
    title: "Practice Arena & Architect",
    shortTitle: "Build",
    icon: "🚀",
    badge: "Domain 3",
    themeClass: "build",
    tagline: "Interactive coding challenges, project boilerplates & API playground",
    systemPrompt: (level = "intermediate", lang = "JavaScript") => `You are TriGuide AI in [Domain 3: Practice Arena & Architect].
Your mission is to help developers practice coding challenges, design software architectures, and generate production-ready boilerplates.
Preferred Language: ${lang}

Guidelines:
1. Provide robust, clean, scalable, and modern starter code.
2. For coding challenges: outline the optimal algorithm, analyze Time & Space Complexity using Big-O notation, and provide comprehensive test cases.
3. For project boilerplates: include sensible folder structure, dependency requirements, input validation, and error handling.
4. Emphasize clean architecture and modern developer standards.
Format with clean Markdown.`,
    quickPrompts: [
      { text: "Solve Two Sum with optimal O(n) Hash Map", query: "Solve Two Sum problem in Python with optimal O(n) time and O(n) space hash map" },
      { text: "Build Express.js REST API with validation", query: "Create an Express.js REST API boilerplate with CRUD endpoints, validation, and error handling" },
      { text: "Convert Python script into TypeScript", query: "Can you explain how to convert a Python class into modern TypeScript with interfaces?" },
      { text: "Write comprehensive PyTest unit tests", query: "Generate PyTest unit tests with edge cases and mocks for a user authentication function" }
    ]
  },

  unified: {
    id: "unified",
    title: "TriGuide Omniverse (All Domains)",
    shortTitle: "Omni",
    icon: "✨",
    badge: "All-in-One",
    themeClass: "unified",
    tagline: "Autonomous routing across Concept Learning, Debugging, and Project Building",
    systemPrompt: (level = "intermediate", lang = "General") => `You are TriGuide AI, the all-in-one developer intelligence copilot unifying:
- Domain 1: Concept & Syntax Learning
- Domain 2: Bug Detection & Code Fixing
- Domain 3: Practice Arena & Project Architecture

Automatically detect which domain best fits the user's intent, label your response with the matching domain badge, and provide an expert, world-class response.`,
    quickPrompts: [
      { text: "What is TriGuide AI?", query: "Introduce yourself: What is TriGuide AI, what are the three domains, and how does the open platform work?" },
      { text: "Help me choose a language to learn first", query: "I want to start programming in 2026. Should I learn Python, JavaScript, or Go? Compare their pros, cons, and career paths." }
    ]
  }
};

export const SUPPORTED_LANGUAGES = [
  { id: "python", name: "Python", icon: "🐍" },
  { id: "javascript", name: "JavaScript", icon: "⚡" },
  { id: "typescript", name: "TypeScript", icon: "🔷" },
  { id: "cpp", name: "C++", icon: "⚙️" },
  { id: "java", name: "Java", icon: "☕" },
  { id: "rust", name: "Rust", icon: "🦀" },
  { id: "go", name: "Go", icon: "🐹" },
  { id: "sql", name: "SQL", icon: "🗄️" },
  { id: "html", name: "HTML / CSS", icon: "🌐" }
];
