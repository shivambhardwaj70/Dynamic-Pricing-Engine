# 🛒 Dynamic Pricing Engine (Backend)

An enterprise-grade, rule-based pricing recommendation engine inspired by modern e-commerce platforms like **Amazon** and **Flipkart**.

The system dynamically recommends optimal product prices by evaluating **market demand**, **available inventory**, and **competitor pricing**, with **AI-generated explanations** for store managers and audit teams.

---

## 🏗️ Architecture & Core Design Principles

### 1. Separation of Concerns (Controller-Service-Repository Pattern)
* **Controllers** (`src/controllers/`): Pure HTTP handlers that parse requests (`req.body`, `req.params`) and dispatch JSON responses.
* **Services** (`src/services/`): Pure business logic and mathematical rule evaluation. The rule engine operates independently of HTTP sockets and database models.
* **Models** (`src/models/`): Mongoose schemas enforcing data integrity, validations, and relational document references (`ref`).
* **Routes** (`src/routes/`): Modular endpoint declarations mapped using `express.Router()`.
* **Middlewares** (`src/middleware/`): Centralized 4-argument error handler (`(err, req, res, next)`) and JSON 404 catch-all.

```
Client (Browser / Postman)
           │
           ▼
     Express Router (`/api/...`)
           │
           ▼
       Controller (Validates input & coordinates DB)
       ├── Product Model (Mongoose)
       ├── Inventory Model (Mongoose)
       └── CompetitorPrice Model (Mongoose)
           │
           ▼
     Pricing Engine Service (Applies Mathematical Rules)
           │
           ▼
     AI Explanation Service (Google Gemini / Fallback XAI)
           │
           ▼
     PriceHistory Model (Immutable Audit Log)
           │
           ▼
Client receives JSON Response
```

---

## ⚡ The 4 Core Pricing Rules

As defined in the system specification, pricing is strictly **rule-based and deterministic**:

| Rule ID | Market Condition | Price Impact | Real-World Business Justification |
| :--- | :--- | :--- | :--- |
| **Rule 1** | **High Demand + Low Stock** ($\le 10$ units) | **+10%** | Scarcity Surge: High consumer interest combined with limited stock allows margin maximization. |
| **Rule 2** | **Low Demand + High Stock** ($\ge 100$ units) | **-10%** | Inventory Clearance: Sluggish sales and warehouse surplus trigger discounts to move stock. |
| **Rule 3** | **Competitor Price is Lower** | **-5%** | Price Defense: Prevents cart abandonment by staying competitive against cheaper rival platforms. |
| **Rule 4** | **Competitor Price is Higher** | **+3%** | Margin Expansion: Market tolerates higher prices; margin is increased while remaining cheaper than competitor. |

> **Safety Guardrails**: Calculated prices are clamped between **50% (minimum floor)** and **200% (maximum ceiling)** of the base price to prevent catastrophic pricing anomalies.

---

## 🤖 Why Explainable AI (XAI)?

A critical architectural decision: **AI does NOT set or calculate product prices.**
* **Risk Prevention**: LLMs can hallucinate extreme prices, resulting in massive business losses.
* **Explainability (XAI)**: The deterministic rule engine performs the calculation with 100% mathematical precision. The LLM (Google Gemini / OpenAI) translates the mathematical decision into a concise, professional explanation for human decision-makers.
* **Graceful Degradation**: If an AI API key is missing or external network is unavailable, a built-in fallback generator creates natural language explanations without failing the request.

---

## 📡 Complete REST API Reference

**Base URL**: `http://localhost:5001`

### 1. Health Check
* `GET /api/health` — Checks server status (returns `{ success: true, message: "Server is running" }`).

### 2. Product Management (`/api/products`)
* `POST /api/products` — Create a product (`{ productName, category, currentPrice }`).
* `GET /api/products` — Get all products (sorted newest first).
* `GET /api/products/:id` — Get single product by MongoDB ID.
* `PUT /api/products/:id` — Update product details or base price.
* `DELETE /api/products/:id` — Remove a product permanently.

### 3. Inventory Management (`/api/inventory`)
* `POST /api/inventory` — Add initial stock (`{ productId, availableQuantity }`).
* `GET /api/inventory` — Get all inventory with populated product details and computed `stockStatus`.
* `GET /api/inventory?status=low` — Filter low-stock products ($\le 10$ units).
* `PUT /api/inventory/:id` — Update stock level by inventory ID or product ID.

### 4. Competitor Pricing (`/api/competitor-prices`)
* `POST /api/competitor-prices` — Add or update competitor price (`{ productId, competitorName, competitorPrice }`).
* `GET /api/competitor-prices` — List competitor prices (optional `?productId=...`).
* `PUT /api/competitor-prices/:id` — Update specific competitor record.
* `GET /api/competitor-prices/compare/:productId` — Price comparison analytics (lowest, highest, average, difference, and comparison status).

### 5. Dynamic Pricing Engine & History (`/api/pricing`)
* `POST /api/pricing/calculate-price` — Evaluates business rules, calculates new price, generates AI explanation, and auto-logs to history.
  ```json
  {
    "productId": "6aeb2de47c4fe7884e646abf",
    "demand": "HIGH"
  }
  ```
* `GET /api/pricing/history` — Chronological timeline of all historical pricing recommendations.
* `GET /api/pricing/history/:productId` *(or `?productId=...`)* — Filter history specifically for a single product.

---

## 🧪 Automated Testing

The project uses **Jest** for automated unit and integration testing.

```bash
cd backend
npm test
```

### Test Coverage (12 Passing Tests across 3 Suites):
* `tests/pricingEngine.test.js`: Verifies Rule 1, Rule 2, Rule 3, Rule 4, rule combinations, and 50%/200% safety guardrails.
* `tests/aiExplanation.test.js`: Verifies deterministic fallback explanation generation.
* `tests/health.test.js`: Verifies HTTP 200 health check and JSON 404 handler.

---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js (v18+)
* MongoDB Atlas account (or local MongoDB)

### 2. Installation
```bash
git clone https://github.com/your-username/Dynamic-Pricing-Engine.git
cd Dynamic-Pricing-Engine/backend
npm install
```

### 3. Environment Configuration
Create a `.env` file inside the `backend/` folder:
```env
PORT=5001
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/dynamic-pricing?retryWrites=true&w=majority

# Optional: AI Provider (Gemini or OpenAI)
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Running the Server
```bash
# Start development server with nodemon auto-reload:
npm run dev

# Run automated tests:
npm test
```

---

## 🎯 Technical Interview Discussion Points

### Why was this project built?
Large e-commerce platforms continuously adjust millions of product prices based on real-time market conditions. This project demonstrates how pricing decisions can be automated reliably using deterministic business rule engines and analytics.

### How does the pricing engine work?
The engine gathers market signals (demand level, current warehouse stock, and competitor prices) and applies four core business rules to calculate a recommended price bounded by safety limits.

### Why was AI used?
AI was integrated strictly for **Explainable AI (XAI)**. The pricing decision remains rule-based and auditable, while the generative AI translates mathematical rule adjustments into natural language insights for store managers.
