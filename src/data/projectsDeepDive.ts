export interface ArchitecturalPillar {
  title: string;
  description: string;
}

export interface ProjectDeepDive {
  id: string;
  name: string;
  role: string;
  period: string;
  github?: string;
  link?: string;
  stack: string[];
  summary: string;
  architecturalPillars: ArchitecturalPillar[];
  technicalHighlights: string[];
  systemTradeoffsAndDecisions: string[];
}

export const PROJECTS_DEEP_DIVE: ProjectDeepDive[] = [
  {
    id: "dialogue-ai",
    name: "Dialogue AI",
    role: "Full-Stack Developer",
    period: "Jun 2026 - Present",
    github: "https://github.com/dimsedra/dialogue-ai",
    stack: [
      "Next.js 16 (React 19)",
      "Electron",
      "TypeScript",
      "PocketBase (SQLite)",
      "Mastra Framework",
      "Vercel AI SDK",
      "xenova/multilingual-e5-small",
      "Playwright"
    ],
    summary:
      "Local-first AI companion desktop application acting as an auditable single source of truth for life (tasks, habits, daily logs, projects) with zero cloud dependency and no telemetry.",
    architecturalPillars: [
      {
        title: "Chat vs. Observer Decoupling",
        description:
          "Eliminates UI latency by separating the interactive Chat Agent (which reads context with zero side-effects and never writes) from the asynchronous background Observer Agent (which parses session transcripts, extracts facts into PocketBase, and writes memories to Markdown)."
      },
      {
        title: "3-Tier Auditable Privacy Memory Pipeline",
        description:
          "Memory is structured into Short-term (transient in-memory chat session thread), Mid-term (Daily Ledger at daily-logs/YYYY-MM-DD.md), and Long-term (auditable Markdown files in system/MEMORIES.md and CONTEXT.md). Users can inspect, edit, or delete any markdown line to revoke agent memory."
      },
      {
        title: "On-Device Semantic Vector Recall",
        description:
          "Runs on-device embedding generation using xenova/multilingual-e5-small directly inside the local runtime, ensuring semantic similarity search occurs with zero cloud calls."
      },
      {
        title: "Mastra Agentic Orchestration with Consent Gates",
        description:
          "Orchestrates multi-step agentic workflows (deep web research via Playwright scraping, asset ingestion, task and habit automation) strictly under a human-in-the-loop gate: the agent proposes, the user confirms, then it acts."
      }
    ],
    technicalHighlights: [
      "Local filesystem (dialogue-folio/) serves as the immutable source of truth; SQLite (PocketBase) is purely a derived fast index.",
      "Workspace-driven context isolation: every conversation is bound to a workspace (e.g. personal, project, health) with distinct behavioral weights.",
      "User profile synthesis is strictly token-budgeted and capped at 2,000 characters to prevent prompt bloat."
    ],
    systemTradeoffsAndDecisions: [
      "Decided against cloud databases to guarantee absolute user privacy, accepting the operational trade-off of managing on-device SQLite and local Node/Electron processes.",
      "Chose plain Markdown files for memory over binary vector databases so users retain 100% data auditability and manual editability."
    ]
  },
  {
    id: "atmos-ecommerce",
    name: "ATMOS E-Commerce & Editorial Web App",
    role: "Full-Stack Developer",
    period: "May 2026",
    github: "https://github.com/dimsedra/ATMOS",
    stack: [
      "Next.js App Router (16+)",
      "React 19",
      "Tailwind CSS v4",
      "Convex (Real-time DB)",
      "Sanity Headless CMS",
      "Stripe API",
      "Motion",
      "Web Audio API",
      "i18next"
    ],
    summary:
      "Full-stack digital platform for an independent Seoul-based music and lifestyle culture house featuring real-time reactive sync, editorial journal, and procedural Web Audio synthesizer.",
    architecturalPillars: [
      {
        title: "Client/Server Boundary Separation",
        description:
          "Next.js App Router handles root HTML pre-rendering, document metadata, OpenGraph, and SEO on the server, while interactive islands (audio synthesizer, cart drawer, visual experiences) operate as isolated client components."
      },
      {
        title: "Hydration Safety for Web Audio & Storage",
        description:
          "Browser-only primitives (window.AudioContext for sound synthesis, localStorage for cart persistence) are guarded strictly post-mount or on user interaction gestures to eliminate SSR hydration mismatches."
      },
      {
        title: "Real-time Reactive Synchronization with Convex",
        description:
          "Employs Convex backend for reactive, optimistic UI updates across merchandise stock and catalog changes without polling overhead, combined with secure Stripe webhook handling."
      }
    ],
    technicalHighlights: [
      "Faithful 1:1 migration from Vite + React 19 to Next.js App Router optimized for zero-config Vercel edge deployment.",
      "Sanity Studio integration for Headless CMS governance across artist discographies, rosters, and bilingual editorial journals.",
      "Responsive Neo-Brutalist visual design system with fluid layout animations using Motion and Tailwind CSS v4."
    ],
    systemTradeoffsAndDecisions: [
      "Avoided heavy global state management libraries (Redux/Zustand) in favor of Convex reactive hooks and localized React context.",
      "Separated editorial content in Sanity from transactional catalog state in Convex for clean separation of concerns."
    ]
  },
  {
    id: "gemstone-classification",
    name: "AI-Powered Gemstone Classification System",
    role: "AI and Software Engineer, Self Initiated",
    period: "Jun 2026 - Jul 2026",
    github: "https://github.com/dimsedra/Gemstone",
    stack: [
      "PyTorch (ResNet50)",
      "FastAPI",
      "Uvicorn",
      "JavaScript",
      "Pytest",
      "CUDA / NVIDIA RTX 3060"
    ],
    summary:
      "Computer vision image classification pipeline and high-performance FastAPI inference service capable of identifying 87 fine-grained gemstone categories from photos.",
    architecturalPillars: [
      {
        title: "Transfer Learning & Fine-Tuning Pipeline",
        description:
          "Trained and evaluated a PyTorch ResNet50 model across 6,700+ images categorized into 87 fine-grained gemstone classes. Achieved 92.8% training accuracy and perfect 100% F1-scores on 14 difficult fine-grained classes."
      },
      {
        title: "Thread-Safe Lazy Model Loading in FastAPI",
        description:
          "Engineered an asynchronous FastAPI backend that loads heavy deep learning model weights lazily and thread-safely on initial request, minimizing memory footprint and cold-start latency."
      },
      {
        title: "Hardware & VRAM Benchmarking",
        description:
          "Rigorously profiled VRAM consumption on an NVIDIA GeForce RTX 3060 (12GB VRAM): frozen backbone at batch size 64 (~2.8 GB), fine-tuning backbone (~3.5 GB), and large-batch scaling (~8.2 GB)."
      }
    ],
    technicalHighlights: [
      "Top-5 class confidence scores returned in JSON alongside class index to gemstone name mapping.",
      "Comprehensive automated Pytest test suite covering 8 critical API scenarios (image payload validation, corrupted file handling, inference latency).",
      "Dark-mode glassmorphic frontend dashboard with drag-and-drop AJAX image upload."
    ],
    systemTradeoffsAndDecisions: [
      "Selected ResNet50 over deeper architectures (ResNet101/Vision Transformers) for the optimal trade-off between inference speed, VRAM economy on consumer hardware, and high fine-grained accuracy.",
      "Kept frontend lightweight (Vanilla HTML/CSS/JS) to prevent framework overhead for a dedicated model-serving demonstration dashboard."
    ]
  },
  {
    id: "exifsense",
    name: "ExifSense – Browser-Native Metadata & Forensic Tool",
    role: "Software Engineer, Self Initiated",
    period: "Apr 2026 - Present",
    github: "https://github.com/dimsedra/ExifSense",
    link: "https://exif-sense.vercel.app/",
    stack: [
      "Vanilla JavaScript (ES6+)",
      "Exifr",
      "Leaflet.js",
      "OSRM (Open Source Routing Machine)",
      "HTML5 Canvas API",
      "jsPDF",
      "Crypto Web API",
      "Node.js CLI"
    ],
    summary:
      "Zero-server, browser-native forensic metadata analysis tool that parses optical camera parameters, detects image editing tampering, reconstructs travel routes, and sanitizes sensitive EXIF data with 100% local privacy.",
    architecturalPillars: [
      {
        title: "Zero-Server Local-Only Privacy Architecture",
        description:
          "Guarantees 100% data confidentiality: image extraction, metadata removal, and report generation execute entirely in the visitor's browser memory without transmitting a single byte to external servers."
      },
      {
        title: "Forensic Analysis & Modification Detection",
        description:
          "Automatically identifies post-processing signatures from software (Photoshop, Lightroom), flags timestamp discrepancies, and verifies cryptographic integrity via instant SHA-256 and SHA-1 hashing."
      },
      {
        title: "Cognitive Insights Translation",
        description:
          "Translates obscure optical parameters (aperture values, exposure bias, focal length) into clear plain-language insights explaining lighting conditions and lens characteristics for non-technical users."
      },
      {
        title: "Standalone Terminal CLI & Simulation Harness",
        description:
          "Includes a companion CLI executable (exifsense) that runs single-asset and batch forensic analyses from the shell, featuring version-controlled simulation test scenarios in tests/fixtures/scenarios/."
      }
    ],
    technicalHighlights: [
      "Geospatial travel route reconstruction combining Leaflet.js and OSRM to render road-following paths across photo series.",
      "One-click privacy sanitization: cleans sensitive GPS coordinates, device serials, and dates with instant client-side download.",
      "Multi-format export engine supporting structured JSON manifests, CSV, Markdown, and custom PDF generation via jsPDF.",
      "Comprehensive localization across English, Bahasa Indonesia, and Arabic (with complete Right-to-Left / RTL layout support)."
    ],
    systemTradeoffsAndDecisions: [
      "Chose client-side Vanilla JavaScript over heavy frontend frameworks to maximize portability, eliminate build step overhead for the core viewer, and allow running index.html directly from local disk.",
      "Leveraged Web Crypto API and Exifr for client-side processing, trading server-side batch scale for complete user privacy."
    ]
  }
];

/**
 * Helper to format deep dive project knowledge into clean, token-efficient English markdown
 * for the AI system prompt.
 */
export function formatProjectsDeepDivePrompt(): string {
  return PROJECTS_DEEP_DIVE.map((p) => {
    const pillars = p.architecturalPillars
      .map((pill) => `  - **${pill.title}**: ${pill.description}`)
      .join("\n");

    const highlights = p.technicalHighlights.map((h) => `  - ${h}`).join("\n");
    const tradeoffs = p.systemTradeoffsAndDecisions.map((t) => `  - ${t}`).join("\n");

    const links = [
      p.github ? `GitHub: ${p.github}` : null,
      p.link ? `Live Demo: ${p.link}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    return `### Project: ${p.name} (${p.period})
Role: ${p.role}
Links: ${links}
Stack: ${p.stack.join(", ")}
Summary: ${p.summary}

Architectural Pillars & Mechanisms:
${pillars}

Technical Highlights:
${highlights}

Engineering Trade-offs & Decisions:
${tradeoffs}`;
  }).join("\n\n---\n\n");
}
