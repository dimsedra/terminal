# Terminal Portfolio (Agentic CLI)

Welcome to my personal portfolio built as an interactive developer terminal. 

This project explores the intersection between human systems thinking and agentic workflows. Instead of a traditional static card layout, the portfolio provides an authentic CLI shell experience with real-time markdown streaming, 3D ASCII rendering, and a guardrailed AI assistant powered by Google Gemini and the Vercel AI SDK.

---

## How It Works

The interface runs on a hybrid model combining deterministic commands with dynamic conversational AI:

- **Standard CLI Shell**: Fast, offline, deterministic slash commands (`/projects`, `/skills`, `/about`, `/contact`, `/help`, `/exit`) that output formatted terminal markdown.
- **Interactive AI Session**: Activated via `/chat`, transforming the terminal into a live conversational session where Google Gemini synthesizes answers about my projects, background, and engineering philosophy in everyday conversational language.
- **Strictly Guardrailed**: The assistant is tightly scoped to represent my work and portfolio. It politely deflects general trivia, arbitrary coding tasks, or unrelated queries back to my portfolio.
- **Visual Design**: Built with JetBrains Mono, restrained dark terminal palette, disciplined spacing, and word-by-word streaming transitions.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **AI Integration**: Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/react`)
- **Model**: Google Gemini (via Google AI Studio)
- **Styling**: Tailwind CSS
- **Markdown & Streaming**: Streamdown
- **Language**: TypeScript

---

## Local Development Setup

To run this project locally on your machine:

### 1. Clone the repository
```bash
git clone https://github.com/dimsedra/terminal.git
cd terminal
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env.local` file by copying the example file:
```bash
cp .env.example .env.local
```

Open `.env.local` and add your Google Gemini API key:
```env
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
AI_MODEL=gemini-3.5-flash-lite
```

You can obtain a free API key from Google AI Studio (https://aistudio.google.com/).

### 4. Start the development server
```bash
npm run dev
```

Open http://localhost:3000 in your browser to explore the terminal.

---

## Deploying to Vercel

This portfolio is optimized for zero-config deployment on Vercel without requiring an external database or backend server.

### Step 1: Push your code to GitHub
Make sure all your latest changes are pushed to your GitHub repository.

### Step 2: Import into Vercel
1. Log in to your Vercel dashboard (https://vercel.com).
2. Click **Add New...** and select **Project**.
3. Choose your `terminal` GitHub repository and click **Import**.

### Step 3: Configure Environment Variables in Vercel
Before clicking deploy, configure the required environment variables:
1. In the **Configure Project** screen, expand the **Environment Variables** section.
2. Add the following key:
   - **Key**: `GOOGLE_GENERATIVE_AI_API_KEY`
   - **Value**: Your Google Gemini API key from Google AI Studio.
3. (Optional) Add custom model selection:
   - **Key**: `AI_MODEL`
   - **Value**: `gemini-3.5-flash-lite` (or any active Gemini model of your choice).
4. Ensure the variables are assigned to **Production**, **Preview**, and **Development** environments.

*Note: If you already deployed before adding the environment variables, you can add them anytime in your Vercel Dashboard under **Project Settings > Environment Variables**, then trigger a redeploy under the **Deployments** tab.*

### Step 4: Deploy
Click **Deploy**. Vercel will build the Next.js app and serve it edge-ready.

---

## Available Slash Commands

- `/chat` — Enter interactive AI session
- `/projects` — View featured projects and repositories
- `/skills` — Inspect technical skills and engineering stack
- `/about` — Read about my background and engineering philosophy
- `/contact` — Get touchpoints (GitHub, LinkedIn, Email)
- `/help` — Display list of all available commands
- `/exit` — Return to the landing hero view and reset active session
