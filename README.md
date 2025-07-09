# Kanban Board

A modern kanban board application built with Next.js, featuring AI-powered assistance, and a clean, responsive interface.

## Features

- **Drag & Drop Interface**: Intuitive task and column management
- **AI Task Assistant**: Natural language task CRUD actions
- **Tag System**: Organize tasks with customizable colored tags
- **Multi-Board Support**: Create and manage multiple project boards
- **Authentication**: Secured user authentication via Auth0
- **Real-time Updates**: Optimistic UI updates with server synchronization

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: Auth0
- **State Management**: Zustand
- **UI Components**: shadcn/ui, Radix UI
- **Drag & Drop**: @hello-pangea/dnd
- **AI Integration**: Vercel AI SDK with OpenAI

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Auth0 account
- OpenAI API key (for AI features)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd kanban
   npm install
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

3. **Set up the database**

   - Run the Supabase migrations in the `supabase/migrations/` folder

4. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                  # Next.js app router pages
├── components/           # React components
│   ├── board/            # Board-specific components
│   ├── chat/             # AI chat components
│   └── ui/               # Reusable UI components
├── lib/                  # Utilities and configurations
│   └── stores/           # Zustand state management
├── supabase/             # Database migrations and config
└── types/                # TypeScript type definitions
```

## Key Features

### AI Task Management

Use natural language to manage tasks:

- "Create a bug fix task in To Do"
- "Move the login task to Done"
- "How many tasks in progress"

### Drag & Drop

- Reorder tasks within columns
- Move tasks between columns
- Reorder columns on the board

### Tag System

- Create custom colored tags
- Assign multiple tags to tasks
