# 🛒 DynaPricer — Full-Stack Dynamic Pricing Engine

[![Live Application](https://img.shields.io/badge/Live%20App-dynapricer.vercel.app-6366F1?style=for-the-badge&logo=vercel&logoColor=white)](https://dynapricer.vercel.app/)
[![API Status](https://img.shields.io/badge/Production%20API-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://dynamic-pricing-engine-backend.onrender.com/api/products)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://cloud.mongodb.com/)
[![Test Suite](https://img.shields.io/badge/Tests-12%2F12%20Passed-22C55E?style=for-the-badge&logo=jest&logoColor=white)](#-testing--data-integrity)

An enterprise-grade, rule-based pricing recommendation system with Explainable AI (XAI), inspired by algorithmic pricing platforms like **Amazon** and **Flipkart**.

* 🌐 **Live Web Application**: [https://dynapricer.vercel.app/](https://dynapricer.vercel.app/)
* ⚡ **Production API (Render)**: [https://dynamic-pricing-engine-backend.onrender.com/api](https://dynamic-pricing-engine-backend.onrender.com/api)

---

## 📸 System Overview & Core Capabilities

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             FULL-STACK ARCHITECTURE                              │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
        ┌────────────────────────────────┴────────────────────────────────┐
        │                                                                 │
        ▼                                                                 ▼
┌───────────────────────────────┐               ┌─────────────────────────────────┐
│       FRONTEND (Vite+React)   │               │       BACKEND (Node/Express)    │
│  • React 18 SPA + React Router│   REST APIs   │  • MVC + Service Architecture   │
│  • Material UI (MUI v6) Theme │ ────────────► │  • 4-Rule Pricing Engine        │
│  • Recharts Telemetry Visuals │  (JSON / HTTP)│  • Google Gemini AI XAI Service │
│  • React.lazy() Code-Splitting│ ◄──────────── │  • MongoDB Atlas / Mongoose     │
│  • Toast Notification System  │               │  • Jest Automated Test Suite    │
└───────────────────────────────┘               └─────────────────────────────────┘
```

### The 5 Frontend Screens
1. **Executive Dashboard (`/`)**: High-level KPIs, isolated product pricing curves with Recharts, inventory health distributions, and real-time audit logs.
2. **Product Catalog (`/products`)**: Complete CRUD operations for catalog products with instant search filtering.
3. **Inventory Management (`/inventory`)**: Stock level monitoring with color-coded status badges (`LOW_STOCK`, `NORMAL_STOCK`, `HIGH_STOCK`) and live rule-impact previews.
4. **Competitor Pricing (`/competitors`)**: Market pricing intelligence feeds (Amazon, Flipkart, etc.) and live competitor price comparisons.
5. **Pricing Recommendation Engine (`/pricing`) ⭐ THE STAR DEMO PAGE**:
   * Interactive product selector and demand toggle (`HIGH`, `NORMAL`, `LOW`).
   * What-If simulation overrides for live demonstration testing.
   * Visual split-screen: Original vs. Recommended Price, Rule Audit breakdown, and plain-English Gemini AI explanation box.

---

## ⚡ The 4 Core Pricing Rules

Pricing is calculated **deterministically** using mathematical business logic (never by generative AI alone):

| Rule ID | Market Condition | Adjustment | Real-World Business Justification |
| :--- | :--- | :---: | :--- |
| **Rule 1** | **High Demand + Low Stock** ($\le 10$ units) | **+10%** | **Scarcity Surge**: High consumer demand combined with inventory scarcity maximizes gross margin. |
| **Rule 2** | **Low Demand + High Stock** ($\ge 100$ units) | **-10%** | **Inventory Clearance**: Sluggish demand and excess warehouse stock trigger discounts to accelerate inventory turnover. |
| **Rule 3** | **Competitor is Cheaper** | **-5%** | **Price Defense**: Defends market share and prevents cart abandonment against lower-priced competitors. |
| **Rule 4** | **Competitor is Pricier** | **+3%** | **Margin Expansion**: Captures extra profit margin while keeping our price attractive and below the competitor. |

> **Safety Guardrails**: Calculated prices are clamped between **50% (floor)** and **200% (ceiling)** of the base catalog price to prevent anomalies.

---

## 🤖 Why Explainable AI (XAI)?

A critical architectural decision: **AI does NOT set or calculate product prices.**
* **Risk Mitigation**: Generative LLMs are non-deterministic and can hallucinate arbitrary prices, leading to severe commercial loss.
* **Explainability (XAI)**: The mathematical Rule Engine calculates the price with 100% precision. The generative AI (Google Gemini / OpenAI) translates the mathematical decisions into executive, plain-English rationale for store managers and audit teams.
* **Graceful Degradation**: If the Gemini API key is missing or offline, a deterministic fallback engine generates professional natural language explanations without crashing.

---

## 🛠️ Technology Stack & Deployment

| Domain | Technology | Hosting / Platform |
| :--- | :--- | :--- |
| **Frontend UI** | React 18, Vite 6, Material UI (MUI v6), Recharts | **Vercel** (`dynapricer.vercel.app`) |
| **Backend API** | Node.js, Express.js, Mongoose ODM | **Render** (Node Web Service) |
| **Database** | MongoDB Atlas (Replica Set) | **MongoDB Cloud** |
| **Artificial Intelligence** | Google Gemini API (Explainable AI) | Cloud REST API |
| **Testing** | Jest, Supertest | CI / Local Runner (12/12 Passing) |

---

## 📡 Complete REST API Reference

**Base URL**: `https://dynamic-pricing-engine-backend.onrender.com/api`

| Method | Endpoint | Description | Request Body / Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Backend health check | *None* |
| `GET` | `/products` | List all catalog products | *None* |
| `POST` | `/products` | Create new product | `{"productName", "category", "currentPrice"}` |
| `PUT` | `/products/:id` | Update product details | `{"productName", "category", "currentPrice"}` |
| `DELETE` | `/products/:id` | Delete product & cascade delete inventory | *None* |
| `GET` | `/inventory` | List stock with populated product details | Optional `?status=low` |
| `POST` | `/inventory` | Initialize stock record for product | `{"productId", "availableQuantity"}` |
| `PUT` | `/inventory/:id` | Update stock quantity | `{"availableQuantity"}` |
| `GET` | `/competitor-prices`| List competitor market feeds | Optional `?productId=...` |
| `POST` | `/competitor-prices`| Add or update competitor price | `{"productId", "competitorName", "competitorPrice"}` |
| `GET` | `/competitor-prices/compare/:productId` | Compare product price against competitors | *None* |
| `POST` | `/pricing/calculate-price` | Run pricing engine, generate AI explanation & log to history | `{"productId", "demand", "manualStockQuantity", "manualCompetitorPrice"}` |
| `GET` | `/pricing/history` | Audit log of all dynamic pricing recommendations | Optional `?productId=...` |

---

## 🚀 Local Development Setup

### 1. Prerequisites
* **Node.js** (v18 or higher)
* **MongoDB Atlas** account (or local MongoDB)

### 2. Clone Repository
```bash
git clone https://github.com/shivambhardwaj70/Dynamic-Pricing-Engine.git
cd Dynamic-Pricing-Engine
```

### 3. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:
```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string

# Optional: Google Gemini AI
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
```

Start the backend server:
```bash
npm run dev
# -> Server running on port 5001 | MongoDB Connected
```

Run demo database seeder:
```bash
npm run seed
# -> Seeds 5 products, 5 inventory records, 9 competitor feeds, and history
```

Run automated backend tests:
```bash
npm test
# -> 12 passed across 3 test suites
```

### 4. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
```

Create a `.env` file inside `frontend/`:
```env
VITE_API_BASE_URL=http://localhost:5001/api
```

Start the Vite development server:
```bash
npm run dev
# -> http://localhost:5173
```

---

## 🧪 Testing & Data Integrity

* **Atomic Cascade Deletion**: Deleting a product automatically triggers an atomic MongoDB transaction that purges associated inventory documents via `Inventory.deleteMany({ productId: id })`, preventing orphaned records.
* **Defensive Normalization**: Inventory queries automatically filter out unreferenced documents to maintain 100% UI stability.
* **Jest Test Suite**: Validates Rule 1 (+10%), Rule 2 (-10%), Rule 3 (-5%), Rule 4 (+3%), multi-rule combinations, safety guardrails (50%-200%), and deterministic AI fallback generation.

