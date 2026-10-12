# CS171 Final Project: Where Our Time Goes

Georgia Messinger, Chloe Nelson-Arzuaga, Mariah Crawford

How Americans, especially young adults, have reallocated their days since 2003, built on the BLS American Time Use Survey (ATUS).

**Live site:** https://cs171finalproject.pages.dev

## Deploys

Cloudflare Pages builds from this repo automatically. A push to `main` updates the live site; any other branch or PR gets its own preview URL (`https://<branch>.cs171finalproject.pages.dev`), linked in a comment on the PR. No build step: Pages serves the repo root as-is.

## What's here

| Path | What it is |
| --- | --- |
| `index.html` | Landing page |
| `prototype-a/` | Where the hours went: brush years on the socializing-by-age chart; a change chart and 24-hour day bars update together |
| `prototype-b/` | Alone or together: one filter bar (group, day type, year) drives a balance scale, a time-alone trend and a who-with breakdown |
| `data/atus.json` | Shared data, minutes per day, 2003–2025 |
| `scripts/fetch_atus.py` | Rebuilds `atus.json` from BLS |

Plain HTML plus D3 v7 from a CDN. No build step.

## Run it locally

The pages load `data/atus.json` with `fetch`, so open them through a local server, not by double-clicking:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Refresh or extend the data

```bash
BLS_CONTACT=you@college.harvard.edu python3 scripts/fetch_atus.py
```

BLS blocks anonymous scripts, so the request carries your email. To add series (more activities, age bands, "who with" categories), edit the code lists at the top of the script. `https://download.bls.gov/pub/time.series/tu/tu.txt` explains the file layout, and the `tu.actcode`, `tu.age`, `tu.who` and `tu.pertype` files map the codes.

Data notes:
- No estimates exist for 2020 (pandemic interruption). Those values are `null`.
- "Who with" data starts in 2010 and counts waking time. Categories overlap.
- By age, "who with" only splits alone vs. not alone, and the age bands differ from the activity data (20–24 instead of 15–24, 65–74 instead of 65+).
- Parent-status splits exist for activities but not for "who with."

## Deploy (Cloudflare Pages)

Pushes to `main` deploy automatically. Every other branch and pull request gets its own preview URL, so work on a branch and share that link for feedback.

Setup (once): Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick this repo. Framework preset: None. Build command: empty. Build output directory: `/`.

## Working together

1. `git pull` before you start.
2. Make a branch: `git checkout -b chloe/heatmap`.
3. Push it and open a pull request. Cloudflare comments a preview link.
4. Merge when the team is happy.
