# 🧠 ResumeIQ

**ResumeIQ** is a full-stack AI-powered career assistant that helps job seekers:

- Upload their resume and parse its content
- Analyze job descriptions to extract required skills
- Detect skill gaps between their profile and target roles
- Generate AI-powered, role-specific interview questions
- Produce ATS-optimized resumes as downloadable PDFs

---

## ✨ Features

| Feature               | Description                                                    |
| --------------------- | -------------------------------------------------------------- |
| **Authentication** | Secure register/login/logout with JWT & token blacklisting     |
| **Resume Upload**  | Upload resumes via Multer for AI processing                    |
| **AI Analysis**    | AI-driven skill gap detection and job description parsing      |
| **Interview Prep** | Auto-generated interview questions tailored to role and resume |
| **PDF Generation** | ATS-optimized resume export powered by Puppeteer               |
| **Report History** | View, retrieve, and manage all past interview reports          |

---

## 🛠 Tech Stack

### Backend

- **Node.js** + **Express.js** — REST API server
- **MongoDB Atlas** + **Mongoose** — Database & ODM
- **JWT** — Authentication & session management
- **Multer** — File upload handling
- **Puppeteer** — Server-side PDF generation
- **Zod** — Schema validation for AI responses

### Frontend

- **React** + **Vite** — Fast, modern frontend
- **React Router** — Client-side routing & protected routes
- **Axios** — HTTP service layer
- **Context API** + **Custom Hooks** — State management (`useAuth`, `useInterview`)

### AI Layer

- **Anthropic / OpenAI API** (or compatible) — Resume analysis, skill gap detection, interview question generation

---

## 🗂 Project Structure

```
resumeiq/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── interviewController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── BlacklistToken.js
│   │   └── InterviewReport.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── interviewRoutes.js
│   ├── services/
│   │   └── aiService.js
│   ├── uploads/
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── InterviewContext.jsx
    │   ├── hooks/
    │   │   ├── useAuth.js
    │   │   └── useInterview.js
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Home.jsx
    │   │   └── InterviewPage.jsx
    │   ├── services/
    │   │   └── api.js
    │   └── App.jsx
    └── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account
- AI API key (Anthropic/OpenAI)

---

### 1. Clone the Repository

```bash
git clone https://github.com/mehuld02/ResumeIQ.git
cd resumeiq
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
AI_API_KEY=your_ai_api_key
CLIENT_URL=http://localhost:5173
```

Start the backend server:

```bash
npm run dev
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🤖 AI Feature Architecture

```
User Input (Resume PDF + Job Description)
        │
        ▼
  Multer (File Upload)
        │
        ▼
  AI Service Layer
  ┌─────────────────────────────────┐
  │  1. Parse resume content        │
  │  2. Extract JD requirements     │
  │  3. Detect skill gaps           │
  │  4. Generate interview Qs       │
  │  5. Structure response (Zod)    │
  └─────────────────────────────────┘
        │
        ▼
  Save InterviewReport → MongoDB
        │
        ▼
  Return to Frontend (Context + Hooks)
```

---

## 📄 PDF Generation Pipeline

1. AI generates an ATS-optimized resume as structured HTML
2. Puppeteer renders the HTML server-side
3. PDF is streamed back to the client as a downloadable file

---

## 🔒 Authentication Flow

- Passwords hashed with **bcrypt**
- JWT issued on login, stored in **HTTP-only cookies**
- Logout invalidates tokens via a **blacklist collection** in MongoDB
- Protected routes verified via `authMiddleware` on every request

---

## 🧪 Testing

APIs can be tested using [Postman](https://www.postman.com/). Import the collection or test endpoints manually:

- Set `Content-Type: multipart/form-data` for resume upload endpoints
- Include `Authorization: Bearer <token>` or rely on cookies for protected routes

