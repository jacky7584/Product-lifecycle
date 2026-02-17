# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

High-performance QR Code generation platform. Users can generate customizable QR codes from various input types (URL, text, WiFi, email, phone, vCard) with support for batch generation and REST API access.

## Architecture

This is a monorepo with two applications:

- **frontend/**: Next.js 14 with Page Router, TypeScript, Tailwind CSS, shadcn/ui
- **backend/**: Python FastAPI with QR code generation service

### Frontend Structure
- `src/pages/` - Page Router pages (index.tsx generator, batch.tsx, api-docs.tsx)
- `src/components/` - React components (QRPreview, QROptions, TypeSelector, forms, Header)
- `src/types/` - TypeScript type definitions

### Backend Structure
- `app/main.py` - FastAPI application entry point
- `app/routers/qr.py` - QR code API route handlers
- `app/services/qr_service.py` - QR code generation logic with caching
- `app/models/schemas.py` - Pydantic request/response models
- `app/config.py` - Application configuration

## Development Commands

### Frontend
```bash
cd frontend
npm install
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm run lint         # Run ESLint
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload    # Start dev server at http://localhost:8000
```

### Testing
```bash
cd backend && python -m pytest tests/ -v    # Backend tests
cd frontend && npm test                      # Frontend tests
```

Access API docs at http://localhost:8000/docs

## Key Patterns

- QR code generation via `qrcode` library with Pillow for image processing
- LRU cache layer for repeated QR code requests (high-throughput optimization)
- Frontend uses debounced API calls for live QR code preview
- Batch generation returns ZIP archives via StreamingResponse
- Multiple output formats: PNG (binary), SVG (XML), Base64 (JSON)

## API Endpoints

- POST `/api/qr/generate` - Generate QR code image (PNG/SVG)
- POST `/api/qr/generate/base64` - Generate QR code as base64 JSON
- POST `/api/qr/batch` - Batch generate QR codes (ZIP)
- GET `/api/health` - Health check
