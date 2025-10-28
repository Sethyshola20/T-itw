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
- Agent & RAG: LangChain 
- Vector DB: Pinecone for fast embedding retrieval
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


### Configuration

Create a `.env.local` file in the root directory with the following content:

NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_MISTRAL_API_KEY=your_mistral_api_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENV=your_pinecone_environment


### Running the App

bun dev


Open your browser at [http://localhost:3000](http://localhost:3000) to use the app.

---

## Usage

1. Upload one or more PDF documents using the file input.
2. Ask questions in the chat input related to the documents.
3. View AI-generated answers with references to the source content.
4. Extend the app with live web search or additional AI agents as needed.

---

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to fork the repo and submit pull requests.

---

## License

This project is licensed under the MIT License.

---

## Acknowledgments

- Inspired by agentic AI workflows and RAG techniques.
- Thanks to OpenAI, Mistral, LangChain, and the AI SDK communities.
- Built with Next.js and Tailwind CSS.

---
