# StudyBuddy - AI-Powered Study Assistant

An EdTech app that helps students study and prepare for tests. Upload your study material as a PDF, mark your understanding of each concept, then get a personalized AI study guide and practice quiz.

## Features

- **PDF Upload**: Upload study material PDFs that get parsed into individual sentences
- **Understanding Tracker**: Mark each sentence as understood (green), partially understood (yellow), or not understood (red)
- **AI Study Guide**: Generate a personalized study guide weighted toward what you don't understand
- **Quiz Mode**: Take multiple-choice quizzes generated from your study material with explanations

## Tech Stack

- **Frontend**: Next.js 16 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o-mini
- **PDF Parsing**: pdf-parse v2

## Setup

### 1. Clone and install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the contents of `supabase-schema.sql` to create all tables and policies
3. Copy your project URL and anon key from Settings > API

### 3. Configure environment variables

Edit `.env.local` and replace the placeholder values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
OPENAI_API_KEY=your_actual_openai_api_key
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## Usage

1. **Upload a PDF** of your study material on the home page
2. **Review sentences** - click each sentence to cycle through understanding levels:
   - Gray (not reviewed) -> Green (understood) -> Yellow (partial) -> Red (not understood)
3. **Generate a Study Guide** - creates a personalized guide focused on what you struggle with
4. **Take a Quiz** - test your knowledge with AI-generated multiple choice questions
