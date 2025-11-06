# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Q-ProcureAssistant is an AI-powered procurement management system for POSCO hackathon. The system uses computer vision to automatically register products via Q-CODE (QR code-like identifiers) and provides real-time inventory tracking through webcam.

**Key Features:**
- AI-powered product image analysis and matching
- Automatic Q-CODE generation for new products
- Real-time inventory monitoring via webcam
- Product similarity detection to avoid duplicate registrations

## Technology Stack

- **Frontend**: React 19 + Vite 7 + TailwindCSS 4 + React Router v7
- **Backend**: FastAPI (Python) - **✅ IMPLEMENTED**
- **Database**: SQLite - **✅ IMPLEMENTED**
- **AI Services**:
  - **OpenAI GPT-4o-mini Vision** (product image analysis & text extraction) - ✅ **ACTIVE**
  - **Google Gemini 1.5 Flash** (visual similarity comparison) - ✅ **ACTIVE** (primary method)
  - **Google Vision API Product Search** - ❌ **UNAVAILABLE** (maintenance mode)
  - 📄 See [VISION_API_STATUS.md](backend/VISION_API_STATUS.md) for AI service status details
  - Roboflow (alternative for real-time webcam detection) - ⏳ TODO

## Development Commands

### Frontend (in `frontend/` directory)

```bash
# Install dependencies
npm install

# Start development server (default: http://localhost:5173)
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm preview
```

### Backend (FastAPI - **IMPLEMENTED**)

Backend is located in `backend/` directory. Start server:

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server URL: `http://localhost:8000`
API Docs: `http://localhost:8000/docs`

The backend exposes these API endpoints:
- `POST /api/analyze-image` - Analyze uploaded product image (supports image + optional specs text)
- `POST /api/products/search-by-specs` - Search products using text specifications only
- `POST /api/products` - Register new product with Q-CODE
- `GET /api/products` - List all products (with filtering/search)
- `GET /api/products/{qcode}` - Get specific product by Q-CODE
- `PUT /api/products/{qcode}` - Update existing product
- `DELETE /api/products/{qcode}` - Delete product
- `POST /api/detect` - Real-time webcam detection endpoint (TODO)

## Architecture

### Frontend Structure

```
frontend/src/
├── App.jsx              # Main app with routing configuration
├── main.jsx            # React entry point
├── components/
│   ├── Layout.jsx      # Main layout with sidebar
│   ├── Sidebar.jsx     # Navigation sidebar with menu
│   └── Header.jsx      # Page header component
└── pages/
    ├── Home.jsx        # Landing page with feature overview
    ├── ProductRegister.jsx  # AI product registration workflow
    ├── LiveInventory.jsx    # Real-time webcam inventory
    └── ProductList.jsx      # Product management table
```

### Frontend Routing

- `/` - Home page
- `/register` - AI Q-CODE Registration
- `/inventory` - Real-time Inventory Monitoring
- `/products` - Product List

### Key Frontend Components

**ProductRegister.jsx** - Main workflow:
1. User uploads product image
2. Image sent to backend `/api/analyze-image`
3. **AI analyzes image using OpenAI Vision**
4. **Gemini compares uploaded image with existing product images (visual similarity)**
5. **Hybrid similarity score calculated (60% visual + 40% text)**
6. Similar products returned with similarity scores:
   - If similarity >= 95%: High match (green badge)
   - If similarity >= 70%: Medium match (yellow badge)
   - If similarity < 70%: Different product
7. If no matches: Prompt user to register as new product
8. New product registration via `/api/products`

**LiveInventory.jsx** - Real-time detection:
- Webcam stream display (not yet implemented)
- Periodic frame capture (every 2-3 seconds planned)
- Send frames to backend for Q-CODE detection
- Display detected products and counts

### Data Flow

1. **Product Registration** (IMPLEMENTED):
   - Upload image → FastAPI receives image
   - OpenAI Vision analyzes image → Extract product info (name, category, material, specs)
   - Gemini Vision compares uploaded image with each existing product image → Visual similarity scores
   - Calculate hybrid similarity (60% visual + 40% text-based)
   - Return top 5 similar products sorted by similarity
   - User decides: use existing product or register new one

2. **Real-time Inventory** (TODO):
   - Webcam frame → FastAPI → Vision API/Roboflow detection → Return detected Q-CODEs with counts

### Backend Schema (Expected)

Products should have these fields:
- `qcode` (unique identifier, auto-generated)
- `name`
- `category`
- `description`
- `image_path`
- `purchase_count`
- `average_rating`
- `last_price`

## Important Notes

- This is a POC (Proof of Concept) for a hackathon - focus on functionality over security
- Backend is planned but not implemented in this repository yet
- API keys are visible in `initial.md` (for hackathon use only):
  - OpenAI API Key
  - Gemini API Key
  - Roboflow API Keys
- Tailwind CSS uses the new v4 Vite plugin (`@tailwindcss/vite`)
- React Router uses v7 data APIs

## Styling

- Uses TailwindCSS v4 with Vite plugin
- Color scheme: Blue gradient sidebar (`from-[#0d47a1] to-[#1565c0]`)
- Component styling: Rounded cards with shadows
- Responsive design with `lg:` breakpoints

## API Integration Points

Frontend expects these backend endpoints:

```javascript
// Product analysis
POST /api/analyze-image
Content-Type: multipart/form-data
Body: { file: File }
Response: {
  ai_analysis: string,
  image_path: string,
  similar_products: Array<{
    id, qcode, name, description, similarity,
    purchase_count, average_rating, last_price
  }>
}

// Product registration
POST /api/products
Content-Type: application/x-www-form-urlencoded
Body: { name, category, description, image_path }
Response: { qcode: string, ...product }
```

## Testing Workflow

To test the complete system:
1. Start backend server on port 8000
2. Start frontend dev server: `cd frontend && npm run dev`
3. Navigate to `/register`
4. Upload a product image (Q-CODE photo)
5. Verify AI analysis and similarity matching
6. Test new product registration
7. Navigate to `/inventory` to test webcam detection (requires backend implementation)
