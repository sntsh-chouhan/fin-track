# FinTrack 🪙

A premium, modern full-stack finance tracker application featuring a highly interactive, dark-themed React web application and an Express-powered TypeScript API backend. Built from the ground up to support high-performance interactions, modern glassmorphic styling, and seamless transitions to React Native in the future.

---

## 🏗️ Project Architecture

This repository is split into two primary components:

1. **`frontend/`**: The client-side web application.
   - **Framework**: React + Vite + TypeScript
   - **Styling**: Modern, premium Vanilla CSS with cohesive HSL-based dark theme variables, glowing accents, smooth micro-animations, and responsive layouts.
   - **Icons**: Lucide React for consistent, lightweight vector icons.
   
2. **`backend/`**: The server-side API application.
   - **Framework**: Node.js + Express.js + TypeScript
   - **Development Tools**: `tsx` for fast TypeScript execution and watching.
   - **Libraries**: `dotenv`, `cors`, `helmet`, `morgan`.

---

## 📁 Directory Structure

```text
fin-track/
├── backend/                  # Express TypeScript API Backend
│   ├── src/
│   │   ├── controllers/      # API Controllers (Business Logic)
│   │   ├── middleware/       # Custom Express middlewares
│   │   ├── models/           # Data types, schemas & models
│   │   ├── routes/           # API Endpoint routes
│   │   └── index.ts          # Server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/                 # React Vite TypeScript Frontend
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── assets/           # Dynamic assets & illustrations
│   │   ├── components/       # Reusable interactive UI components
│   │   ├── styles/           # Global design tokens and HSL palettes
│   │   ├── App.tsx           # Main application shell
│   │   └── main.tsx          # React entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md                 # Project documentation (this file)
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
* `npm` or `yarn`

---

### 💻 1. Setting Up the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start the development server (runs by default on port `5000`):
   ```bash
   npm run dev
   ```

---

### 🎨 2. Setting Up the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite local development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

---

## 📱 Future Roadmap

* **Phase 1**: Highly responsive dark-themed dashboard skeleton and mocking.
* **Phase 2**: Core business logic (transaction tracking, budget planning, visual analytics).
* **Phase 3**: Backend database integration (PostgreSQL / MongoDB) and secure JWT Authentication.
* **Phase 4**: Native mobile app wrapper using React Native sharing the same design tokens and backend API.
