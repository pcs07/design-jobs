# DesignJobsHub

Aggregated design job listings from the top 100 tech companies — UX, product design, design systems, research, and more. Deployed as a static site on GitHub Pages, rebuilt daily via GitHub Actions.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 App Router + Tailwind CSS + TypeScript |
| Scraper | TypeScript + Playwright + Zod |
| Storage | `public/data/jobs.json` (gitignored, generated in CI) |
| Hosting | GitHub Pages (free) |
| CI/CD | GitHub Actions (free) |

---

## Repo Structure

```
design-jobs/
├── config/
│   ├── companies.json      ← Committed: list of companies + ATS tokens
│   └── keywords.json       ← Committed: configurable design keyword list
├── apps/
│   ├── web/                ← Next.js static site
│   │   └── public/data/    ← Gitignored: jobs.json generated here
│   └── scraper/            ← Job collection pipeline
├── data/                   ← Gitignored: alternative local output
├── .github/
│   └── workflows/
│       └── scrape-and-deploy.yml
└── README.md
```

---

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 9+

```bash
# Install pnpm if needed
npm install -g pnpm

# Install all workspace dependencies
pnpm install
```

### Step 1 — Seed sample data (no scraping needed)

```bash
pnpm seed
# → writes apps/web/public/data/jobs.json with 15 realistic sample jobs
```

### Step 2 — Start the dev server

```bash
pnpm dev
# → http://localhost:3000
```

### Step 3 — Run the real scraper (optional)

```bash
pnpm scrape
# → fetches live jobs from Greenhouse/Lever APIs
# → writes apps/web/public/data/jobs.json (gitignored)
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Companies directory — all 100 companies, job counts, last updated |
| `/jobs` | All design jobs with search, filter, sort |
| `/company/[slug]` | Single company — their design jobs only |

---

## How Data Is Kept Out of Git

`apps/web/public/data/` is in `.gitignore`. The pipeline is:

```
[GitHub Actions daily]
     │
     ▼
pnpm scrape  →  apps/web/public/data/jobs.json   (never committed)
     │
     ▼
pnpm build   →  apps/web/out/  (static HTML + data/jobs.json baked in)
     │
     ▼
Deploy to GitHub Pages  →  live site shows job data
```

The `jobs.json` travels through the CI pipeline as an artifact and is included in the deployed `out/` folder — but is never committed to the git history.

---

## How to Add/Update the Companies List

Edit `config/companies.json`. Each entry:

```json
{
  "id": "acme",
  "name": "Acme Corp",
  "slug": "acme",
  "domain": "acme.com",
  "portalUrl": "https://jobs.acme.com",
  "sourceType": "greenhouse",
  "boardToken": "acmecorp",
  "notes": "optional notes"
}
```

**`sourceType` options:**

| Value | When to use |
|---|---|
| `greenhouse` | Company uses Greenhouse ATS. Set `boardToken` to the board slug (visible in `https://boards.greenhouse.io/<token>`). |
| `lever` | Company uses Lever ATS. Set `boardToken` to the company slug (`https://jobs.lever.co/<token>`). |
| `scrape` | No public API — generic Playwright scraper will be used. Add a custom handler in `apps/scraper/src/scrapers/playwright-scraper.ts` if the generic extractor isn't sufficient. |
| `rss` | Not yet implemented. |

**TODO — expand to 100 companies:** The current seed list has 10 companies. Add more in `config/companies.json`. Most major tech companies use Greenhouse or Lever. Useful lookup:
- [Greenhouse customer list](https://www.greenhouse.io/customers)
- Check `https://boards-api.greenhouse.io/v1/boards/<token>/jobs` to verify a token works.

---

## Configuring Keywords

Edit `config/keywords.json` — no code changes needed:

```json
{
  "keywords": [
    "product designer",
    "ux designer",
    "design systems",
    ...
  ]
}
```

Jobs are included only if their title contains at least one keyword (case-insensitive).

---

## Deploy for Free (GitHub Pages)

### 1. Create a GitHub repo

Push this project to a new GitHub repository.

### 2. Enable GitHub Pages

1. Go to **Settings → Pages**
2. Source: **GitHub Actions**

### 3. Set Actions permissions

Go to **Settings → Actions → General**:
- Workflow permissions: **Read and write permissions**
- Check: **Allow GitHub Actions to create and approve pull requests**

### 4. First deploy

Either push to `main` or manually trigger the workflow:
- Go to **Actions → Scrape & Deploy → Run workflow**

The site will be live at: `https://<your-username>.github.io/<repo-name>/`

### 5. Schedule

The workflow runs daily at 06:00 UTC automatically. You can change the schedule in `.github/workflows/scrape-and-deploy.yml`.

---

## Legal & Ethical Notice

> **IMPORTANT:** This project collects publicly available job listings. Always:
>
> - Prefer official APIs (Greenhouse, Lever) over scraping HTML.
> - Respect each site's `robots.txt`. Check before adding a company with `sourceType: "scrape"`.
> - Never bypass authentication or paywalls.
> - Rate-limit requests (built-in: 0.8–1.8s delay between companies).
> - Identify the bot with a descriptive `User-Agent` (set in scrapers).
> - Some portals' Terms of Service prohibit automated access — review before adding.
>
> This tool is for personal/research use. Not affiliated with any listed company.

---

## Running Tests / Linting

```bash
# Type check the web app
pnpm --filter web exec tsc --noEmit

# Type check the scraper
pnpm --filter scraper exec tsc --noEmit
```

---

## Troubleshooting

**"No jobs found" on the home page**
→ Run `pnpm seed` to generate sample data, or `pnpm scrape` for real data.

**Greenhouse API returns 404**
→ The `boardToken` in `companies.json` may be incorrect. Check the Greenhouse board URL for that company.

**Playwright scraper hangs**
→ Make sure you ran `pnpm --filter scraper exec playwright install chromium`.

**GitHub Actions fails on deploy**
→ Ensure GitHub Pages is set to "GitHub Actions" source in repo Settings.
