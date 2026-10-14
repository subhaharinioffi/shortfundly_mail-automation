# ShortFundly OTT Marketplace - Odisha Email Automation

An enterprise-grade, high-deliverability email automation workflow and campus outreach portal developed for ShortFundly OTT Marketplace to partner with higher-education colleges and universities in Odisha.

---

## Key Highlights & System Architecture

* **Framework**: Next.js 14 (App Router, JavaScript / JSX, React 18)
* **Design System**: Bespoke Cinema OTT CSS (No Tailwind CSS, 100% SVG Vector Icons, Zero Emojis)
* **Landing Page**: Minimalist layout featuring React Bits interactive WebGL Threads component
* **Database**: SQLite via `better-sqlite3` with WAL mode and ACID transaction isolation
* **Email Transmission Engine**: Node.js Nodemailer via Google SMTP with TLS pooling
* **Authentication & RBAC**: Next-Auth JWT sessions with Bcrypt hashing and brute-force lockout protection
* **Deliverability**: Pure plain-text delivery with SPF/DKIM envelope alignment, zero bulk spam headers, and automatic subject sanitization

---

## Core Functional Modules

1. **College Directory (`/colleges`)**
   * Verified directory of higher-education institutions in Odisha.
   * Search by college name, city, department, contact person, or official email address.
   * CSV Dataset Import engine with duplicate prevention and RFC validation.
   * Real-time export to formatted CSV.
   * CRUD controls to add, edit, or remove institution records.

2. **Email Templates (`/templates`)**
   * Rich proposal template manager with variable replacement tokens:
     * `[College Name]`, `[City]`, `[Department]`, `[Recipient Name]`, `[Official Website]`, `[Your Name]`, `[Your Role]`
   * Live preview synchronized with real database records.
   * Pure plain-text preview matching recipient inbox view.

3. **Automated Campaigns (`/campaigns`)**
   * Filter target recipient colleges by city, status, or search query.
   * Multi-select batch outreach execution with live progress bars.
   * Automated cooldown guard (30-day default duplicate prevention).
   * Sequential delivery pacing (800ms-1500ms delay) to maintain Google SMTP sender reputation.

4. **Direct Send (`/manual-send`)**
   * Single-college manual outreach for bespoke institutional proposals.
   * Direct recipient email, department, contact person, and custom proposal body.
   * Option to save newly entered colleges into the master directory.
   * Immediate dispatch with live delivery receipt logging.

5. **Outreach Logs (`/logs`)**
   * Real-time delivery tracking across Sent, Failed, and Skipped-Duplicate categories.
   * 1-click retry mechanism for failed transmissions.
   * Full search, pagination, and log audit management.

6. **Settings & Deliverability Engine (`/settings`)**
   * Google SMTP configuration (Host: `smtp.gmail.com`, Port: 465 SSL).
   * Google App Password setup instructions with 2-Step Verification walkthrough.
   * Built-in connection tester verifying live SMTP handshake.
   * Deliverability Inspector showing active anti-spam safeguards.

---

## Default Roles & Access Credentials

The portal is pre-configured with 3 role-protected accounts:

| Role | Email Address | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@shortfundly.com` | `Admin@ShortFundly2026` |
| **HR** | `hr@shortfundly.com` | `HR@ShortFundly2026` |
| **Tech Lead** | `techlead@shortfundly.com` | `TechLead@ShortFundly2026` |

*Note: Email addresses must be entered in lowercase. The login portal enforces real-time case validation.*

---

## Getting Started

### 1. Prerequisites
* Node.js v18+ (tested on Node v25)
* npm or yarn

### 2. Installation
```bash
git clone https://github.com/subhaharinioffi/shortfundly_mail-automation.git
cd shortfundly_mail-automation
npm install
```

### 3. Initialize Database
Initialize the SQLite schema, seed initial operators, default proposal templates, and sample Odisha institutions:
```bash
node scripts/init-db.js
```

### 4. Build and Run
```bash
# Development mode
npm run dev

# Production build and run
npm run build
npm start
```
The application will be live at `http://localhost:3000` (or `http://localhost:3001` if port 3000 is occupied).

---

## Security Audit & Verification Suites

The repository includes programmatic test suites:

* **Cyber Security Audit (OWASP Top 10 Compliance)**:
  Tests HTTP security headers, uppercase login rejection, brute-force rate limiting, RBAC access control, SQL injection parameterization, and stored XSS sanitization.
  ```bash
  node scripts/security-audit.js
  ```

* **Concurrency Load Test**:
  Benchmarks concurrent traffic, throughput (RPS), and latency percentiles under load.
  ```bash
  node scripts/load-test.js
  ```

---

## License
Proprietary software developed for ShortFundly OTT Marketplace.
