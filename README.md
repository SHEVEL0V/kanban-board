# Kanban Board

A multi-board task management app.

[![Kanban Board](https://img.shields.io/badge/Live-Demo-blue)](https://kanban-808925023135.europe-west1.run.app)

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19
- **Language**: TypeScript
- **Styling**: MUI 9
- **Database**: PostgreSQL, Prisma 7
- **Features**: Drag-and-drop (@dnd-kit), AI Assist (Gemini API), Auth (JWT/bcrypt)

## Development

### Setup

1. Copy `.env.example` to `.env` and fill in the required variables.
2. Ensure PostgreSQL is running.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run migrations and seed the database:
   ```bash
   npx prisma migrate dev
   ```

### Demo User

For testing purposes, you can use the following credentials:

- **Name**: Demo User
- **Email**: `demo@example.com`
- **Password**: `password123`
