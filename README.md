# HousePlanner

Interactive house and plot planning tool built with Next.js 14, Zustand, and Tailwind CSS.

## Features

- **Plot Setup** — Enter width & height in feet, label 4 sides A/B/C/D, pick origin corner
- **50+ Household Items** — Rooms, doors, windows, bathrooms, kitchen, bedroom furniture, living room, dining, outdoor elements, stairs
- **Drag & Drop Canvas** — SVG canvas with snap-to-grid, zoom in/out, pan, undo/redo
- **Properties Panel** — Edit label, position (X/Y), size (W×H), rotation, color, layer
- **Coordinates** — Each item shows exact coordinates from the origin corner
- **Export** — Download as TXT report, JSON data, or CSV spreadsheet; Print/PDF
- **Auth** — Register/Login with JSON file-based session (runtime read/write)
- **Dashboard** — View, open, and delete saved plans with thumbnail previews

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/login` automatically.

## Deploying to Vercel

> **Important**: Vercel's serverless functions run in a read-only filesystem.
> The local JSON file storage works perfectly in development but **data will not persist** between deployments on Vercel.
>
> For production persistence, replace `src/lib/storage.ts` with:
> - **Vercel KV** (Redis) — simplest, `npm i @vercel/kv`
> - **Vercel Postgres** — `npm i @vercel/postgres`
> - **MongoDB Atlas** — free tier
>
> The API routes and auth logic don't need to change — only the storage layer.

```bash
# Deploy
npx vercel deploy --prod
```

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Auth hashing | bcryptjs |
| Canvas | SVG (no canvas API) |
| Storage | JSON files (local) |

## Project Structure

```
src/
  app/
    api/auth/        login, register, logout, me
    api/plans/       CRUD for plans
    login/           Login page
    register/        Register page
    dashboard/       Plan list dashboard
    planner/[id]/    Main planner editor
  components/planner/
    PlannerCanvas    SVG drag-drop canvas
    ItemPanel        Left sidebar with searchable item list
    PropertiesPanel  Right sidebar: edit selected item
    Toolbar          Top bar: save, export, grid, undo/redo
    PlotSetup        Modal for plot dimensions & origin
    ExportModal      Export to TXT / JSON / CSV
  lib/
    items.ts         50+ household item definitions
    storage.ts       JSON file read/write helpers
    auth.ts          Session cookie helpers
  store/
    planner.ts       Zustand store for canvas state
  types/
    index.ts         TypeScript types
data/
  users.json         Registered users (created at runtime)
  plans/             One JSON file per saved plan
```
