Access the app at https://t-itw.vercel.app/

# AI Document Chat Assistant

A Next.js app that allows users to upload PDF documents and chat with an AI assistant that answers questions based on the document content using Retrieval-Augmented Generation (RAG) with Gemini

---

## Features

- Upload and process PDF files
- Semantic search over document content using RAG
- Interactive chat interface for querying documents
- Modular React components for clear separation of concerns
- Integration with AI SDKs for natural language understanding and generation

---

## Tech Stack

- Frontend: Next.js (React) with Tailwind CSS
- Backend: Next.js APIGemini, Mistral via AI SDK
- Agent & RAG: LangChain
- Vector DB: Pinecone for fast embedding retrieval
- Form handling: react-hook-form with Zod validation

---

## Project Structure

- `/components`: UI components such as `Chat`, `DocumentUploader`,
- `/app/api`: API endpoints (`/chat/files/upload/route.ts`, `/chat/route.ts`, `/chat/[id]/stream/route.ts`, `/chat/history/route.ts`)
- `/page.tsx`: Main chat page integrating components and state management
- `/types`: TypeScript types and validation schemas

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- API keys for Gemini
- Access to a vector database service (Pinecone or Weaviate)

### Installation

### Configuration

Create a `.env.local` file in the root directory with the following content:

POSTGRES_URL=
AUTH_SECRET=
GOOGLE_GENERATIVE_AI_API_KEY=
PINECONE_API_KEY=
PINECONE_HOST=
REDIS_URL=

### Running the App

bun dev

Open your browser at [http://localhost:3000](http://localhost:3000) to use the app.

---

## Usage

1. Upload one PDF document using the file input.
2. Ask questions in the chat input related to the documents.
3. View AI-generated answers with references to the source content.
4. Extend the app with live web search or additional AI agents as needed.

---
