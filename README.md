# Stardesk – pixel life planner

A free planner with 11 switchable colour themes (Pink Pixel is the default; also Ocean Blue, Fresh Green, Sunset Orange, Warm Sand, Silver Gray, Galaxy Night, Midnight Blue, Emerald Night, Ember Dark, Graphite Black), now with 30+ mini apps.
Built with React 18 + Vite 5 + date-fns (+ `adhan` for prayer times). No backend and no database: all data is saved in the visitor's browser (localStorage), with JSON export/import in Settings.

## What is inside
**Basics** – Day/Week/Month planner with repeating events and reminders, tasks, habits with streaks, Pomodoro study timer, classes & timetable, key-date countdowns, notes on four paper styles.

**Daily life** – meal planner + grocery list, reusable shopping/packing lists, home chores with rotation, budget & expenses (chart + limit warnings), bills & subscriptions, birthdays & anniversaries with gift ideas, travel planner.

**Health** – water & sleep tracker, workout log, medicine reminders, breathing timer, mood journal with monthly heatmap, private cycle tracker.

**Work** – job application tracker, freelance projects + invoices + time tracker, meeting notes, Eisenhower matrix, weekly priorities with Friday review, routines / habit stacking.

**Growth & fun** – goals & vision board, gratitude journal, reading list, movies/shows watchlist, bucket list (confetti), daily quote & challenge, time capsule.

**Utilities** – world clock, prayer times + Hijri date (calculated offline), weather (Open-Meteo, no key), countdown widgets.

**Everywhere** – customisable Home widgets (hide / reorder / resize), Apps launcher with pins, global search (Ctrl/Cmd + K, arrow keys + Enter), JSON backup/restore with undo, installable PWA that works offline, 11 colour themes.

## Privacy
- Everything lives in `localStorage` (`stardesk:v2`; the old `stardesk:v1` copy is kept for safety).
- The cycle tracker and time capsules are never indexed by search and can be left out of a backup.
- The only network call is the weather widget, which sends the chosen city's coordinates to Open-Meteo.

## Backup & restore
Settings → **Export backup** downloads `stardesk-backup-YYYY-MM-DD.json`. **Import backup** replaces current data (older v1 backups are upgraded automatically). Before a restore or "Delete everything", a copy of your current data is kept so **Undo** can bring it back.

## Run locally
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview  # serve dist/ to test the PWA
```

## Adding a new app later
1. Add a row in `src/lib/apps.js` (`ready: true`).
2. Create the view in `src/views/` and register it in `VIEWS` in `src/App.jsx`.
3. Add a collection in `src/lib/schema.js` (`defaults`, `ARRAYS`/`OBJECTS`, and `migrate` if nested).
4. Make it searchable by adding one object in `src/lib/searchSources.js`.

## Deploy on Vercel
1. Push this folder to a GitHub repo.
2. Vercel → Add New → Project → import the repo. Framework is auto-detected as **Vite** (build `npm run build`, output `dist`).
3. Deploy.

## Shipping an update
Bump `CACHE` in `public/sw.js` (e.g. `stardesk-v5`) every release so visitors' old cached files are replaced.

## After you get your real domain
Replace `https://stardesk.vercel.app` with your real URL in:
- `index.html` (canonical, og:url, og:image, twitter:image, JSON-LD url)
- `public/sitemap.xml`
- `public/robots.txt`

Then add the site in Google Search Console and submit `/sitemap.xml`.