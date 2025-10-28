# AI Document Chat Assistant

A Next.js app that allows users to upload PDF documents and chat with an AI assistant that answers questions based on the document content using Retrieval-Augmented Generation (RAG) with OpenAI and Mistral APIs.

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
- Backend: Next.js API Routes with TypeScript
- AI APIs: OpenAI, Mistral via AI SDK
- Agent & RAG: LangChain or Haystack (optional)
- Vector DB: Pinecone or Weaviate for fast embedding retrieval
- Form handling: react-hook-form with Zod validation

---

## Project Structure

- `/components`: UI components such as `PDFUploader`, `ChatInput`, `ChatMessages`
- `/app/api`: API endpoints (`upload.ts`, `chat.ts`)
- `/page.tsx`: Main chat page integrating components and state management
- `/types`: TypeScript types and validation schemas

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- API keys for OpenAI and/or Mistral
- Access to a vector database service (Pinecone or Weaviate)

### Installation

