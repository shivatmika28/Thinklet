# Thinklet — AI-Powered Personalised Study Companion

Thinklet is an AI-powered student dashboard and study companion. It transforms lecture notes and textbooks (up to 20 pages) into structured topic masteries, generates diagnostic quizzes, pinpoints weak topics with server-evaluated precision, and orchestrates personalized revision plans with targeted practice.

---

## 🌟 Key Features

1. **Multi-Source Material Ingestion**:
   - Drag-and-drop PDF upload (enforcing a 20-page maximum with page-level text extraction).
   - Scanned image PDF detection with clear guidance to avoid OCR hallucinations.
   - Paste text alternative with automatic page chunking and citation preservation.
   - One-click **Demo Mode** with pre-configured high-yield study material.

2. **Strict Grounding with Gemini 3.8 Flash**:
   - Uses the official `@google/genai` SDK and Interactions API.
   - Grounded strictly in uploaded content: claims, questions, and explanations attach exact inline citations like `[Page 2]`.
   - Never fabricates facts: if a topic is outside the material, explicitly discloses: *"This information is not available in your uploaded material."*

3. **5-Question Diagnostic Quizzes**:
   - Generates 5 multiple-choice questions (4 options each) distributed across topics.
   - Answer keys are kept strictly on the server and never exposed before submission.
   - Server evaluates answers, scores accuracy, and categorizes topics scoring <60% as **Weak Areas**.

4. **Personalized Revision Plan & Targeted Practice**:
   - Automatically prioritizes high-priority revision tasks for identified weak topics.
   - Generates 3 targeted follow-up practice questions with instant revealable feedback and page references.
   - Checkbox tracking for pending and completed revision tasks.

5. **Progress & Mastery Analytics**:
   - Tracks quiz attempts over time.
   - Topic mastery progress bars (Needs Attention / Competent / Mastered).
   - Shows score progression and improvements across attempts.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Server Actions / Route Handlers, TypeScript)
- **Styling**: Tailwind CSS with custom educational SaaS design tokens
- **AI Engine**: Google Gemini API via official `@google/genai` SDK (`gemini-3.8-flash`)
- **Database**: Prisma ORM with SQLite (`dev.db`)
- **PDF Parser**: `unpdf` (universal page-by-page server-side parser)
- **Validation**: Zod schema validation for structured outputs
- **Icons**: Lucide React

---

## 🔑 Configuration & Environment Variables

Copy `.env.example` to `.env.local` (and `.env` for Prisma):

```bash
# Gemini API Key (obtain from https://aistudio.google.com/)
GEMINI_API_KEY="your-gemini-api-key-here"

# Prisma SQLite Connection
DATABASE_URL="file:./dev.db"
```

> **Note**: Both legacy keys (`AIza...`) and the newer format (`AQ...`) are supported.

---

## 🚀 Setup & Execution Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database
```bash
npx prisma db push
```

### 3. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing the Complete User Journey

1. Open [http://localhost:3000](http://localhost:3000).
2. If no material is present, click **"Load Demo Material"** on the Dashboard or sidebar.
3. Explore the **Learn** screen: select any topic (e.g. *Cellular Architecture & Organelles*), review the grounded explanation with `[Page X]` citations, and test the Q&A input.
4. Go to **Quiz**: click **Start Diagnostic Quiz**, answer the 5 questions, and submit.
5. Review the **Results**: see your server-evaluated score, topic accuracy breakdown, weak areas (<60%), and answer review.
6. Check the **Revision Plan**: mark tasks as completed, and try the 3 targeted follow-up practice questions.
7. Open **Progress**: inspect your historical scores and topic mastery progression.
