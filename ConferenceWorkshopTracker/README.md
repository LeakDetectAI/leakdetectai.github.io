# Research Deadlines

A responsive, static conference-deadline tracker for GitHub Pages. No installation, API key, or backend is required. The checked-in portable bundle works by opening index.html directly as well as on GitHub Pages. Includes search, area filters, official-verification filtering, deadline sorting, source history, conflict detection, and AoE-aware live countdowns with local-time conversion.

## Host on GitHub

This checkout is configured for `LeakDetectAI/MLPrivacyTracker`.

1. Commit and push these files to the repository's `main` branch.
2. In the repository, open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
3. Open **Actions → Deploy GitHub Pages → Run workflow** if the first push happened before Pages was enabled.
4. After the deployment succeeds, visit **https://leakdetectai.github.io/MLPrivacyTracker/**.

The workflow regenerates the portable bundle, validates the catalogue and deadline logic, then publishes only the website's public assets. Relative asset URLs support repository subpaths and custom domains. GitHub documentation: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Run locally

```sh
python3 -m http.server 4173
```

Visit http://localhost:4173, or open index.html directly. Both load the same embedded catalogue without fetching local JSON. Run the small correctness suite with `node --test tests/*.test.js` (Node 20+).

## Maintain the catalogue

Edit `data/venues.json`, run `node scripts/build.mjs`, commit the source and generated `tracker.js`, and push. GitHub Actions also regenerates the bundle before publishing. The site uses a **manual snapshot**, not automatic scraping. The catalogue includes 48 venues across 64 records and is a suggested starting set, not a confirmed personal list. Fifty-two submission records have recorded dates; the remainder intentionally show “Not recorded.” Missing dates do not imply that a CFP has not been published. CORE badges use the official ICORE2026 edition, checked 14 September 2026. All 30 conferences were searched; 27 have matched entries and SaTML, AACL and EACL have no matching entry found. Two starter journals, TIFS and JMLR, have historical 2024 SCImago best-quartile and SJR values from indexed official tables. Direct SCImago access returned HTTP 403, so these are explicitly not latest-edition verifications.

Use SecDeadlines, AI Deadlines and WikiCFP for discovery. For verification, check the official main conference page first, then look for Call for Papers, Important Dates, submission, or dates pages. For IEEE venues, also check the official IEEE conference directory and the relevant IEEE society page. Review the official CFP, or the applicable ARR/OpenReview page, before adding an official observation. All observations in one record must refer to the same edition, track and cycle. Create another record with a unique ID for another cycle and set its `cycle` label. The starter records cover selected upcoming cycles, not complete submission histories. The browser recalculates countdowns from the visitor's current time while the page is open.

Use `data/source-links.json` as the regex-friendly source registry. It stores the best discovery feeds, ranking sources, official URL templates, and primary official websites for conferences, workshops, and journals. Prefer its official URL templates first, then fall back to discovery feeds when a new year's official page has not been found yet.

Each observation records `name`, `url`, `authority` (`official` or `discovery`), `checked` (YYYY-MM-DD), and `paper`. The six milestone fields are `abstract`, `paper`, `earlyReject`, `reviewsReleased`, `decision` (acceptance notification), and `cameraReady`. Use null for unrecorded dates. Every venue card shows all six fields, including when dates are missing. Set `type` to `conference`, `workshop`, or `journal`; all use the same milestone display. Official observations win over discovery observations; the most recently checked observation wins within the same authority. Conflicting paper dates are flagged. Observations with no paper date do not override a dated observation. Fields are not silently combined between sources. ARR venue-route records can also store `arrReviewingSchedule` for reviewer registration, reviews due, author response, meta-review release, and cycle end.

Use explicit ISO offsets for submission timestamps: `2026-11-17T23:59:59-12:00` for 11:59 PM AoE. Unless an official source explicitly gives a different submission time zone, store submission deadlines as 11:59 PM AoE (Anywhere on Earth), corresponding to UTC-12. Use `YYYY-MM-DD` only for non-countdown milestones when the time or zone has not been verified. The printed date preserves the source calendar date. Countdown values show full remaining days; closed entries remain visible below upcoming dates. A stale-check message appears after 30 days.

For a verified rank, add `"rank": {"value": "A*", "edition": "verified ranking edition", "url": "https://portal.core.edu.au/..."}` using the actual checked ranking record. Never infer a rank from a deadline feed.

Workshops show their host conference without ranking badges. Use `workshopKind` to distinguish named workshops from program timelines; program targets and ambiguous cutoffs are excluded from verified submission deadlines. The workshop view groups each kind by host and sorts within each group. See [the workshop audit](WORKSHOP-AUDIT.md).

Seed date sources (checked 14 September 2026):

- IEEE conference directory: https://www.ieee.org/conferences/
- IEEE S&P: https://sp2027.ieee-security.org/cfpapers.html
- USENIX Security '27 Cycle 1/2: https://www.usenix.org/conference/usenixsecurity27/call-for-papers
- CCS 2026 review cycles: https://www.sigsac.org/ccs/CCS2026/call-for/call-for-papers.html
- NDSS 2027 summer/fall cycles: https://www.ndss-symposium.org/ndss2027/submissions/call-for-papers/
- CSF 2027 summer/fall/winter cycles: https://www.ieee-security.org/TC/CSF2027/
- PETS 2027 issue cycles: https://petsymposium.org/cfp27.php
- RAID 2026 CFP: https://raid2026.org/call.html
- SaTML 2027 CFP: https://satml.org/call-for-papers/
- ACSAC 2026 technical papers: https://www.acsac.org/2026/submissions/papers/
- ESORICS 2026 winter/spring cycles: https://sites.google.com/di.uniroma1.it/esorics2026/call-for/papers?authuser=0
- ASIACCS 2027 cycles: https://asiaccs2027.cityu.edu.mo/important-dates/index.html
- EuroS&P 2027 event page: https://eurosp2027.ieee-security.org/
- AAAI-27 main technical track: https://aaai.org/conference/aaai/aaai-27/
- EMNLP/AACL/EACL/NAACL/COLING ARR submission and commitment dates, plus ACL 2027 month-only listing: https://aclrollingreview.org/dates
- ICML future meetings: https://icml.cc/Conferences/FutureMeetings
- IJCAI future conferences: https://www.ijcai.org/future_conferences
- SecDeadlines fallback discovery feed: https://sec-deadlines.github.io/

The static snapshot label in `index.html` should be updated when the catalogue is reviewed. Per-record check dates remain the actual observation dates. There are no fabricated deadline examples in production data.

## Files

- `index.html`, `styles.css`: responsive interface
- `app.js`, `logic.js`: rendering, filters, date handling, source precedence
- `scripts/build.mjs`, `tracker.js`: dependency-free generator and portable browser bundle
- `data/venues.json`: editable catalogue
- `data/source-links.json`: source registry with official links, URL templates, and regex hints
- `.github/workflows/pages.yml`: Pages publishing workflow
- `tests/logic.test.js`: deadline and catalogue validation

Typography uses Google Fonts with system fallbacks. The site remains usable if those fonts cannot load.

INSTICC additions: ICISSP, ICAART, IoTBDS, CLOSER, ICPRAM, and SECRYPT 2027. Each has separate stage 1 and stage 2 records, sourced from its official ImportantDates.aspx page on 14 September 2026. ICISSP, ICAART and ICPRAM stage 1 use the extended September 29, 2026 deadline shown on their official pages. ICISSP is noted as co-located with ICAART, ICORES and ICPRAM, with ICISSP registration giving non-speaker access to those conferences. Abstracts-track submissions are not treated as abstract registration for regular papers. The venue total counts distinct names; deadline and verification counts count submission records.

Workshop route additions: FLMSec, Privacy in the Era of Large Opaque Models, InfPriv, AAAI-27 Workshops, EACL 2027 Workshops, COLING 2027 Workshops, ICLR 2027 Workshops, NAACL 2027 Workshops, and ACL 2027 Workshops. These are stored as `type: "workshop"` and use official workshop pages, OpenReview, or ACL-family workshop timelines where available. Workshop ranking badges are omitted; host context is shown separately.

Ranking metadata is independent of deadline observations. CORE records store system, value, edition, source URL, checked date and the matched official title. Missing CORE entries have a null value and explicit search status, not an invented rank. Journal records use system SCImago, metricYear, edition, category/scope, SJR, source URL, checked date, and verification status. A best quartile is not asserted to apply to every subject category. Filters keep CORE grades and SCImago quartiles separate.

Requested journals added: TACL, CL, ACM TOPS, JBD and TMLR, alongside TIFS/JMLR. CL and JBD use indexed official 2024 snapshots. TACL retains the supplied Q1 with unknown score/year. ACM TOPS retains owner-supplied Q1 / 0.783 / 2025 explicitly as unverified. TMLR uses secondary-source 2025 Q2 / 0.744, with categories and a link to the official record for verification. Unknown metric fields are null, not invented. Journal publisher labels follow the user-provided catalogue.
