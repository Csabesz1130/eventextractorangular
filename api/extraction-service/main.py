# main.py
import os
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from extractor import extract_event_from_text, create_calendar_placeholder

app = FastAPI()

# CORS middleware for Angular dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:3000"],  # Angular dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExtractRequest(BaseModel):
    text: str
    source: Optional[str] = "unknown"
    source_meta: Optional[Dict[str, Any]] = None
    locale: Optional[str] = "en"
    timezone: Optional[str] = "UTC"

class ApproveRequest(BaseModel):
    event: Dict[str, Any]
    user_id: Optional[str] = None

@app.post("/extract")
async def extract(req: ExtractRequest):
    try:
        result = await extract_event_from_text(
            text=req.text, source=req.source, source_meta=req.source_meta,
            locale=req.locale, timezone=req.timezone
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/approve")
async def approve(req: ApproveRequest):
    # MVP stub: in production call calendar APIs here
    created = create_calendar_placeholder(req.event, req.user_id)
    return {"status": "ok", "calendar_event": created}

@app.get("/suggestions_stub")
def suggestions_stub():
    # Simple dev stub returning a couple of suggestions
    return [
        {
            "title": "Dentist appointment",
            "start": "2025-11-10T14:00:00+00:00",
            "end": "2025-11-10T14:30:00+00:00",
            "timezone": "Europe/Budapest",
            "location": "Smile Dental, Main St 10",
            "attendees": ["me@example.com"],
            "description": "Routine cleaning",
            "reminders": [30],
            "recurrence": None,
            "confidence": 0.92,
            "raw_text_snippet": "Your appointment is on Nov 10 at 3pm...",
            "source": "stub"
        }
    ]

