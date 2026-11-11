# Dynamic Pricing Engine — Frontend

## Stack
- **React 18** + **Vite 6** — fast HMR dev server
- **Material UI (MUI) v6** — component library with Google Material Design
- **React Router DOM v6** — client-side routing
- **Axios** — HTTP client for Express backend
- **Recharts** — analytics visualizations

## Development Setup

```bash
# From project root
cd frontend
npm install
npm run dev        # → http://localhost:5173
```

## Backend Requirement
Make sure the Express backend is running at **http://localhost:5001** before starting the frontend.

```bash
# In a separate terminal, from project root
cd backend
npm run dev
```

## Environment Variables
Create a `.env` file in `frontend/` for the backend URL:

```
VITE_API_BASE_URL=http://localhost:5001/api
```

Defaults to `http://localhost:5001/api` if not set.

## Folder Structure
```
frontend/
├── public/               # Static assets
├── src/
│   ├── api/
│   │   └── client.js     # Centralized Axios instance
│   ├── components/
│   │   ├── common/       # Reusable: StatCard, StatusBadge, PageHeader, etc.
│   │   └── layout/       # AppShell, Sidebar, Topbar
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Products.jsx
│   │   ├── Inventory.jsx
│   │   ├── Competitors.jsx
│   │   └── Pricing.jsx
│   ├── theme/
│   │   └── index.js      # MUI custom theme (Inter, indigo palette, navy sidebar)
│   ├── App.jsx           # Router + Layout wrapper
│   └── main.jsx          # React entry point
├── index.html
├── vite.config.js
└── package.json
```
