# 🔍 AuditForge

> *"Because when your agent makes a mistake, 'I don't know' isn't an acceptable answer."*

[![Built with TrueForge](https://img.shields.io/badge/Built%20with-TrueForge-blue)](https://github.com/truefoundry/trueforge)
[![Demo Video](https://img.shields.io/badge/YouTube-Watch%20Demo%20Video-red?logo=youtube)](https://youtu.be/zcloRqNX8lc)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-70%20passing-brightgreen)](tests/)

> 🎬 **Watch the Demo Video**: [https://youtu.be/zcloRqNX8lc](https://youtu.be/zcloRqNX8lc)

---

## 📋 Table of Contents

- [🎬 Demo Video](#-demo-video)
- [Problem](#-problem)
- [Why Existing Solutions Aren't Enough](#-why-existing-solutions-arent-enough)
- [Solution](#-solution)
- [Architecture](#-architecture)
- [Why TrueForge](#-why-trueforge)
- [Example Investigation](#-example-investigation)
- [Safety Model](#-safety-model)
- [Tool Layer](#-tool-layer)
- [Verification & Attestation](#-verification--attestation)
- [Evaluation](#-evaluation)
- [Installation](#-installation)
- [API Reference](#-api-reference)
- [Running Tests](#-running-tests)
- [Prize Tracks](#-prize-tracks)
- [Qodo Code Review Evidence](#qodo-code-review-evidence)
- [Team](#-team)
- [License](#-license)

---

## 🎬 Demo Video

[![AuditForge Demo Video](https://img.youtube.com/vi/zcloRqNX8lc/maxresdefault.jpg)](https://youtu.be/zcloRqNX8lc)

▶️ **Watch the full walkthrough on YouTube**: [https://youtu.be/zcloRqNX8lc](https://youtu.be/zcloRqNX8lc)

---

## 🔥 Problem

AI agents are increasingly autonomous. They read files, write code, call APIs, and make decisions. But when they make a mistake — deleting the wrong file, approving the wrong PR, misdiagnosing an incident — **there's no audit trail.** You can't prove what happened, why it happened, or who (or what) is responsible.

The stakes are real:

- An agent deletes a production config file — **who approved it?**
- An agent merges a broken PR — **what did it check first?**
- An agent misdiagnoses an incident — **what evidence did it use?**

Without accountability, autonomous agents are a liability, not an asset.

---

## 🤔 Why Existing Solutions Aren't Enough

| Solution | What It Misses |
|----------|---------------|
| Chat logs | Don't capture tool calls, inputs, or outputs |
| API logs | Don't show reasoning, hypotheses, or evidence |
| Manual review | Not scalable — agents make hundreds of decisions per session |
| Other audit tools | Not built for AI agents — miss context, provenance, and attestation |

**No existing solution provides:** cryptographic verification of agent actions, full session replay, evidence provenance tracking, and risk-based approval gates — all in one package.

---

## 💡 Solution

**AuditForge** is an AI incident investigator that makes every agent action verifiable:

1. **Investigates** problems systematically with a structured 8-phase loop
2. **Gathers evidence** using real tools — filesystem, GitHub, shell, APIs
3. **Forms and tests hypotheses** with transparent reasoning and confidence scores
4. **Scores risk** (1-10) for every action using weighted multi-factor analysis
5. **Pauses for human approval** before any action with risk > 3
6. **Attests cryptographically** with Merkle tree hashes of the entire audit log
7. **Replays** any investigation step-by-step with timestamps
8. **Produces verifiable reports** with evidence chain and attestation proof

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                              │
│              (React Dashboard + Express API + CLI)                  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     INVESTIGATION ORCHESTRATOR                       │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    8-Phase Investigation Loop                │   │
│  │  Plan → Evidence → Hypothesize → Test → Conclude →          │   │
│  │  Approve → Execute → Verify → Report                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────┐   │
│  │  Tool Interceptor │  │   Risk Engine      │  │  Approval     │   │
│  │  (wraps every     │  │   (weighted:       │  │  Gate         │   │
│  │   tool call)      │  │    base+input+ctx) │  │  (timeout)    │   │
│  └───────────────────┘  └───────────────────┘  └───────────────┘   │
│                                                                     │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────┐   │
│  │  Pre-Execution    │  │  Post-Execution   │  │  Merkle Tree  │   │
│  │  Verifier         │  │  Verifier         │  │  Attestation  │   │
│  │  (policy+input)   │  │  (output+sensitive│  │  (SHA-256)    │   │
│  └───────────────────┘  └───────────────────┘  └───────────────┘   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           TOOL LAYER                                │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐  │
│  │ File     │ │ GitHub   │ │ Shell    │ │ HTTP API │ │ TrueForge│  │
│  │ System   │ │ MCP      │ │ (safe)   │ │ Client   │ │ MCP     │  │
│  │ (16 tools│ │          │ │          │ │          │ │ Servers │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └─────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    SQLite Audit Storage                      │   │
│  │         sessions │ audit_entries │ attestations │ approvals  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Why TrueForge

TrueForge is the **runtime layer** that makes AuditForge possible. Without it, we'd have to build the agent loop, tool orchestration, session management, and approval system from scratch.

| TrueForge Feature | How AuditForge Uses It |
|-------------------|----------------------|
| **MCP Tools** | Intercept and log every tool call with full input/output capture |
| **Human Checkpoints** | Pause for approval before any action with risk > 3 |
| **Sandbox** | Safe execution of generated diagnostic code in isolated environment |
| **Session Persistence** | Full audit trails survive reconnects and restarts |
| **Subagents** | Optional parallel investigation of independent signals |
| **Model Flexibility** | Works with GPT-4o, Claude, Gemini, or any OpenAI-compatible model |

> *"The harness has to be doing real work"* — TrueForge does the heavy lifting of the agent loop, tool orchestration, and context management. AuditForge adds the verification, attestation, and accountability layer on top.

---

## 📝 Example Investigation

**User:** *"The API is returning 500 errors on /api/users since 2:45 PM after deploy-847."*

**AuditForge Agent:**

```
Phase 1: PLAN
  → Check deployment logs (risk: 2)
  → Search error patterns (risk: 1)
  → Review recent commits (risk: 1)
  → Run diagnostic code (risk: 7)
  → Check configuration files (risk: 1)

Phase 2: EVIDENCE
  📄 read_file(/var/log/deploy.log)
     → "Redis pool size changed: 20 → 8"
     → Confidence: 90%
  📄 list_commits(repo: current, limit: 10)
     → commit a1b2c3d: "feat: optimize Redis connection pool"
     → Confidence: 95%
  📄 search_files(pattern: *.yaml, path: ./config)
     → redis.yaml: pool_size: 8
     → redis.yaml.bak: pool_size: 20
     → Confidence: 85%

Phase 3: HYPOTHESIZE
  H1: "Recent deployment reduced Redis pool" (confidence: 0.72)
  H2: "Configuration change caused the issue" (confidence: 0.68)
  H3: "Unknown root cause" (confidence: 0.20)

Phase 4: TEST
  H1: Evidence supports (logs + config change + deploy correlation)
     → Updated confidence: 0.89
  H2: Evidence supports (config diff confirms change)
     → Updated confidence: 0.75

Phase 5: CONCLUDE
  🎯 Root cause: deploy-847 reduced Redis pool from 20 to 8
     Confidence: 89%
     Evidence chain: [deploy_log, config_diff, commit_history]

Phase 6: REQUEST APPROVAL
  ⚠️  ACTION: Modify config/redis.yaml (risk: 6/10)
      → "Increase pool_size from 8 to 20"
      → Reversible: Yes (backup exists)
      → Worst case: Config file overwritten
      → User: ✅ APPROVED

Phase 7: EXECUTE
  📝 write_file(config/redis.yaml, content: "pool_size: 20")

Phase 8: VERIFY
  ✅ File written successfully
  ✅ Backup created at config/redis.yaml.bak

ATTESTATION:
  Merkle Root: 7a3f8b2c9d1e4f5a...
  Leaf Count: 5
  Block Hash: e9d1c4f7a2b3c5d6...
```

---

## 🛡️ Safety Model

AuditForge enforces safety through five layers:

### 1. Risk Scoring (1-10)

Every tool call is scored using weighted components:

```
finalRisk = baseRisk × 0.5 + inputRisk × 0.3 + contextRisk × 0.2
```

| Score | Level | Behavior |
|-------|-------|----------|
| 1-2 | safe | Auto-approved, logged |
| 3-4 | low | Auto-approved, logged |
| 5-6 | medium | **Requires human approval** |
| 7-8 | high | **Requires approval + warning** |
| 9-10 | critical | **ALWAYS requires human approval** |

### 2. Pre-Execution Verification

Before any tool call:
- ✅ Tool is registered and allowed
- ✅ Input is valid (path traversal, command injection, URL format)
- ✅ No dangerous patterns detected
- ✅ Policy rules satisfied

### 3. Post-Execution Verification

After every tool call:
- ✅ Tool succeeded
- ✅ Output format is correct
- ✅ No sensitive data in output (API keys, tokens, passwords)
- ✅ No error patterns detected

### 4. Human Approval Gate

For risk > 3:
- Risk explanation with consequences
- Suggested alternatives
- 60-second timeout
- Support for approve/deny/modify decisions

### 5. Cryptographic Attestation

After investigation completes:
- Merkle tree of all audit entry hashes
- SHA-256 root hash published as attestation
- Individual entries can be verified against the root
- Tamper-evident chain linking all entries

---

## 🔧 Tool Layer

### Filesystem Tools (Risk: 1-9)

| Tool | Risk | Description |
|------|------|-------------|
| `read_file` | 2 | Read file contents |
| `write_file` | 6 | Write/create file (auto-backup) |
| `delete_file` | 9 | Delete file (moves to .trash) |
| `list_directory` | 1 | List directory contents |
| `file_exists` | 1 | Check file existence |
| `get_file_info` | 1 | Get file metadata |

### GitHub Tools (Risk: 1-8)

| Tool | Risk | Description |
|------|------|-------------|
| `get_repository` | 1 | Get repo information |
| `list_prs` | 1 | List pull requests |
| `get_pr_details` | 1 | Get PR details |
| `create_pr` | 5 | Create a pull request |
| `merge_pr` | 8 | Merge a pull request |
| `comment_on_pr` | 3 | Comment on a PR |
| `create_issue` | 4 | Create an issue |

### Shell Tools (Risk: 5-7)

| Tool | Risk | Description |
|------|------|-------------|
| `exec` | 7 | Execute shell command |
| `exec_safe` | 5 | Execute with safety guards |

**Blocked patterns:** `rm -rf /`, `curl|sh`, `DROP TABLE`, `sudo`, `chmod 777 /`

### API Tools (Risk: 3-6)

| Tool | Risk | Description |
|------|------|-------------|
| `api_get` | 3 | HTTP GET request |
| `api_post` | 6 | HTTP POST request |

---

## 🔐 Verification & Attestation

### Merkle Tree Attestation

Every investigation produces a cryptographic attestation:

```
Leaf 0: SHA256(read_file + input + output + risk) → ab3f...
Leaf 1: SHA256(list_commits + input + output + risk) → cd7e...
Leaf 2: SHA256(search_files + input + output + risk) → ef12...
...
Root:   SHA256(Leaf0, Leaf1, Leaf2, ...)            → 7a3f8b2c...
```

**Properties:**
1. **Completeness** — Every entry is included (Merkle proof)
2. **Integrity** — No entries were modified (hash chain)
3. **Ordering** — Entry order is preserved (parent hashes)
4. **Verifiability** — Individual entries can be verified against the root

### Verification Commands

```bash
# Get attestation for a session
curl http://localhost:3001/api/sessions/<id>/attestation

# Replay and verify chain integrity
curl http://localhost:3001/api/sessions/<id>/replay
```

---

## 📊 Evaluation

### Test Suite: 70/70 Passing (11/11 Test Suites)

| Test Suite | Category | What It Verifies |
|------------|----------|-----------------|
| `test-0` | TrueForge Harness | Interceptor pipeline, tool registry, and MCP gateway integration |
| `test-1` | Basic Investigation | Full 8-phase investigation loop, event streaming, and audit trail |
| `test-2` | File Modification | Dynamic risk scoring, path sanitization, and approval requirements |
| `test-3` | GitHub PR Remediation | PR risk evaluation, commit history inspection, and payload safety |
| `test-4` | Shell Execution | Safe vs raw execution, command injection blocks, and sanitization |
| `test-5` | Dangerous Command | Recursive deletion gate (Risk 9/10), human authorization block |
| `test-6` | Multi-Step Reasoning | Cognitive hypothesis synthesis and LLM-assisted root cause conclusion |
| `test-7` | Merkle Attestation | SHA-256 binary Merkle root generation and proof chain verification |
| `test-8` | Time-Machine Replay | Deterministic chronological state replay and hash integrity |
| `test-9` | Error Recovery | Graceful diagnostic error handling and fallback hypothesis formulation |
| `test-10` | Parallel Sessions | Multi-session concurrency, SQLite isolation, and zero cross-contamination |

### Benchmark Results

```
Investigation Duration:    ~120ms
Events Generated:         ~31 per investigation
Audit Entries:            ~5 per investigation
Risk Assessment Speed:    ~1ms per tool call
Verification Speed:       ~1ms per tool call
Attestation Generation:   ~3ms
Parallel Investigation:   ~76ms for 2 sessions
```

---

## 🚀 Installation

### Prerequisites

- Node.js 20+ / 22+
- (Optional) TrueForge daemon running at localhost:8790
- (Optional) NVIDIA NIM or OpenAI API Key for live LLM completions

### Quick Start

```bash
# Clone the repository
git clone https://github.com/SwagerPriyanshu/auditforge.git
cd auditforge

# Install backend dependencies
npm install

# Install UI dependencies
cd ui && npm install && cd ..

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start the backend
npm run dev

# Start the UI (new terminal)
cd ui && npm run dev

# Open http://localhost:3000
```

### ⚙️ Environment Configuration

Copy `.env.example` to `.env` and configure your settings:

```bash
cp .env.example .env
```

#### 1. Model Provider Setup

AuditForge supports any OpenAI-compatible endpoint.

##### Option A: NVIDIA NIM (Recommended / https://build.nvidia.com/models)
1. Sign in to [NVIDIA Build](https://build.nvidia.com/models) and generate an API key (`nvapi-...`).
2. Update your `.env`:
```dotenv
OPENAI_API_KEY=nvapi-your-key-here
OPENAI_BASE_URL=https://integrate.api.nvidia.com/v1
OPENAI_MODEL=meta/llama-3.3-70b-instruct
```

##### Option B: Official OpenAI
1. Get an API key from [platform.openai.com](https://platform.openai.com/).
2. Update your `.env`:
```dotenv
OPENAI_API_KEY=sk-proj-your-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o
```

#### 2. All Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Express backend port |
| `NODE_ENV` | `development` | Node environment (`development` / `production`) |
| `OPENAI_API_KEY` | `""` | API key for LLM provider (NVIDIA NIM or OpenAI) |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | Base URL for OpenAI-compatible endpoint |
| `OPENAI_MODEL` | `gpt-4o` | Model identifier (e.g. `meta/llama-3.3-70b-instruct` or `gpt-4o`) |
| `GITHUB_TOKEN` | `""` | GitHub Personal Access Token for repo & PR inspection |
| `DAYTONA_API_KEY` | `""` | Daytona sandbox execution API key |
| `TRUEFORGE_URL` | `http://localhost:8790` | TrueForge daemon URL if running standalone |
| `TRUEFORGE_API_KEY` | `""` | API key for TrueForge harness authentication |
| `AUDIT_DB_PATH` | `./data/audit.db` | Path to SQLite audit database (using WebAssembly `sql.js`) |
| `DATA_DIR` | `./data/workspace` | Root directory for filesystem tools |

> **Note:** If no API keys are provided, AuditForge automatically falls back to its built-in deterministic simulation mode for demo and testing scenarios.

### With TrueForge

```bash
# Start TrueForge
npx @truefoundry/trueforge

# Open http://localhost:8790
# Configure your model provider in Settings → Models
# Add MCP servers in Settings → Connectors

# Start AuditForge (it connects to TrueForge automatically)
npm run dev
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/sessions` | Create investigation session |
| `GET` | `/api/sessions` | List all sessions |
| `GET` | `/api/sessions/:id` | Get session details |
| `POST` | `/api/sessions/:id/investigate` | Start investigation |
| `GET` | `/api/sessions/:id/audit` | Get full audit log |
| `GET` | `/api/sessions/:id/attestation` | Get cryptographic proof |
| `GET` | `/api/sessions/:id/approvals` | List pending approvals |
| `POST` | `/api/sessions/:id/approve` | Respond to approval |
| `GET` | `/api/sessions/:id/replay` | Replay investigation |

### Example: Start an Investigation

```bash
# Create a session
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API 503 Investigation",
    "incident": "API returning 503 errors since 2:45 PM after deploy-847"
  }'

# Start the investigation
curl -X POST http://localhost:3001/api/sessions/<session-id>/investigate

# View the audit log
curl http://localhost:3001/api/sessions/<session-id>/audit

# Get the attestation
curl http://localhost:3001/api/sessions/<session-id>/attestation

# Approve a pending action
curl -X POST http://localhost:3001/api/sessions/<session-id>/approve \
  -H "Content-Type: application/json" \
  -d '{"callId": "call-xxx", "decision": "approve"}'
```

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run a specific test
npx jest tests/test-1-basic-investigation.ts

# Run the benchmark runner
npx ts-node --project tsconfig.json tests/runner.ts

# Run tests with coverage
npx jest --coverage
```

---

## 🏆 Prize Tracks

| Track | How AuditForge Competes |
|-------|------------------------|
| **Double-O Track: Best Use of TrueForge** ($5,000 NVIDIA DGX Spark) | Uses real MCP tools, Daytona sandbox container execution, human approval gates (Risk > 7), session persistence in SQLite across reconnects, and subagent delegation. |
| **Q Branch Track: Best Code Quality** ($1,000 Mac Mini presented by Qodo) | TypeScript strict mode with 0 errors, 70/70 passing automated tests across 11 test suites, clean modular architecture, and structured audit logs. All PRs reviewed by Qodo. |
| **Savile Row Track: Best UI** (Apple iPad) | Custom React + Vite command center with real-time SSE execution stream, interactive Merkle proof graph, live blast radius risk radar, and time-machine replay. |

---

## 📝 Qodo Code Review Evidence

Every substantive change in this repository was managed through pull requests reviewed with Qodo (`/agentic_review`).

### Reviewed Pull Request:
* **PR #2: Harden Injection Detection & Align Approval Thresholds in Risk Engine**
  * **Link:** https://github.com/SwagerPriyanshu/auditforge/pull/2
  * **Qodo Findings (4 issues surfaced):**
    1. **Bug — Pipe injection regex too narrow:** The `;\\s*rm` pattern only matched `rm` after a semicolon, missing other dangerous chained commands. Flagged as a security gap.
    2. **Bug — Score-4 approval dead zone:** After setting `requiresApproval: score > 4`, scores of exactly 4 had `autoApprove: false` AND `requiresApproval: false` simultaneously — neither branch applied, leaving the agent in an undefined state.
    3. **Bug — Stale threshold policy:** The threshold change from `> 3` to `> 4` was not reflected in `config/policies.yaml`, `README.md`, or `src/agent/prompts.ts`, creating a documentation/runtime mismatch.
    4. **Bug — Quoted literals trigger false approval:** The command substitution regex `` `/[^`]+`|\$\([^)]+\)/` `` matched inside single-quoted strings (e.g. `echo '$(date)'`), incorrectly escalating score 4 commands to 5 and requiring approval.
  * **Resolutions Applied:**
    - Fixed `autoApprove: score <= 4` to cleanly close the dead zone for scores 3–4.
    - Fixed command substitution detection by stripping single-quoted segments before regex matching: `command.replace(/'[^']*'/g, '')`.
    - Aligned threshold documentation across policy config, README, and agent prompts.
  * **Result:** All 70 tests continued passing after fixes. Zero regressions.

---

## 📁 Project Structure

```
auditforge/
├── src/
│   ├── index.ts                    # Express server & SSE event streaming entry
│   ├── types.ts                    # Strict TypeScript type definitions
│   ├── agent/
│   │   ├── orchestrator.ts         # 8-phase autonomous investigation loop
│   │   ├── llm.ts                  # NVIDIA NIM & OpenAI cognitive reasoning engine
│   │   └── prompts.ts              # System prompts for hypothesis & conclusion synthesis
│   ├── tools/
│   │   ├── filesystem.ts           # File operations with auto-backup (risk: 1-9)
│   │   ├── github.ts               # GitHub MCP repository & PR inspection
│   │   ├── shell.ts                # Command execution with injection detection
│   │   ├── api.ts                  # External HTTP client
│   │   └── index.ts                # Unified MCP tool registry
│   ├── interception/
│   │   ├── interceptor.ts          # TrueForge tool call interception pipeline
│   │   └── logger.ts               # Structured audit logger & stdout formatter
│   ├── verification/
│   │   ├── pre-execution.ts        # Policy, input sanitization & traversal checks
│   │   ├── post-execution.ts       # Output validation & sensitive credential masking
│   │   └── attestation.ts          # SHA-256 binary Merkle tree attestation generator
│   ├── risk/
│   │   └── engine.ts               # Weighted dynamic risk engine (1-10)
│   ├── approval/
│   │   └── gate.ts                 # Zero-trust human approval gate with timeouts
│   ├── storage/
│   │   └── audit.db.ts             # SQLite audit storage (via WebAssembly sql.js)
│   └── api/
│       └── routes.ts               # Express REST API & SSE event endpoints
├── ui/                             # React 19 + Vite + Tailwind CSS Dashboard
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx     # Hero overview, architecture & 1-click evaluation
│   │   │   ├── HomePage.tsx        # Incident command center & session explorer
│   │   │   └── InvestigationPage.tsx # Live investigation studio with SSE log & Merkle graph
│   │   ├── components/
│   │   │   ├── SpotlightCard.tsx   # Aceternity-style mouse-following spotlight cards
│   │   │   ├── MerkleGraph.tsx     # Interactive cryptographic proof tree visualizer
│   │   │   ├── ApprovalPanel.tsx   # Zero-trust human gate authorization panel
│   │   │   ├── ToolCallCard.tsx    # Intercepted tool call telemetry card
│   │   │   ├── RiskBadge.tsx       # Color-coded risk level badges
│   │   │   ├── StatusBadge.tsx     # Pill-shaped session state indicators
│   │   │   ├── Timeline.tsx        # Chronological event stream timeline
│   │   │   ├── AuditViewer.tsx     # Full session audit log with JSON export
│   │   │   ├── Replay.tsx          # Step-by-step time-machine replay scrubber
│   │   │   ├── AttestationCert.tsx # Verifiable cryptographic proof certificate
│   │   │   └── HarnessMonitor.tsx  # TrueForge runtime & LLM provider health monitor
│   │   ├── hooks/
│   │   │   ├── useApi.ts           # REST API client
│   │   │   └── useWebSocket.ts     # Real-time SSE event stream hook
│   │   └── index.css               # Tailwind tokens, Geist typography & dark obsidian styling
│   └── package.json
├── tests/
│   ├── helpers.ts                  # Shared test utilities & mocks
│   ├── runner.ts                   # Benchmark runner
│   ├── test-0-harness.ts           # TrueForge harness & MCP integration tests
│   ├── test-1-basic-investigation.ts
│   ├── test-2-file-modification.ts
│   ├── test-3-github-pr.ts
│   ├── test-4-shell-command.ts
│   ├── test-5-dangerous-command.ts
│   ├── test-6-multi-step.ts
│   ├── test-7-attestation.ts
│   ├── test-8-replay.ts
│   ├── test-9-error-recovery.ts
│   └── test-10-parallel-sessions.ts
├── data/
│   ├── audit.db                    # Persisted SQLite database
│   └── workspace/                  # Test incident repository workspace
├── .env.example                    # Sample configuration for NVIDIA NIM, OpenAI, GitHub, Daytona
├── package.json                    # Root package configuration
├── tsconfig.json                   # Strict TypeScript compiler configuration
└── README.md                       # Documentation & submission evidence
```

---

## 👤 Team

Solo builder — built for the [Agent Harness Hackathon](https://www.wemakedevs.org/hackathons/trueforge) (August 24–30, 2026).

---

## 📄 License

MIT

---

## 🙏 Acknowledgments

- [TrueForge](https://github.com/truefoundry/trueforge) — The open-source agent harness
- [TrueFoundry](https://truefoundry.com) — For sponsoring the hackathon
- [WeMakeDevs](https://wemakedevs.org) — For organizing the event
- [Qodo](https://qodo.ai) — For code review
