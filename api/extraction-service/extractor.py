# extractor.py
import os
import json
import re
from typing import Dict, Any, Optional
from openai import OpenAI
import spacy
from dateparser.search import search_dates
import pytz
import datetime
import math

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
nlp = spacy.load("en_core_web_sm")

def strip_quoted_text(text: str) -> str:
    text = "\n".join([l for l in text.splitlines() if not l.strip().startswith(">")])
    text = re.sub(r"On .* wrote:\n(.|\n)*", "", text)
    text = re.sub(r"\n--\n.*", "", text, flags=re.S)
    return text.strip()

def extract_temporal_candidates(text: str, timezone: str = "UTC", languages: Optional[list] = None, locale: str = "en"):
    # Default to locale if languages not provided
    if languages is None:
        languages = [locale, "en"]  # Try locale first, then English
    
    settings = {
        "RETURN_AS_TIMEZONE_AWARE": True,
        "TIMEZONE": timezone,
        "PREFER_DATES_FROM": "future",
    }
    res = search_dates(text, settings=settings, languages=languages)
    return res or []

def format_iso(dt: datetime.datetime, timezone: str = "UTC"):
    if dt.tzinfo is None:
        try:
            tzinfo = pytz.timezone(timezone)
        except Exception:
            tzinfo = pytz.UTC
        dt = tzinfo.localize(dt)
    # return ISO with tz
    return dt.isoformat()

def spaCy_entities(text: str):
    doc = nlp(text)
    persons = []
    locations = []
    orgs = []
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            persons.append(ent.text)
        elif ent.label_ in ("GPE","LOC","FAC"):
            locations.append(ent.text)
        elif ent.label_ in ("ORG",):
            orgs.append(ent.text)
    return {"persons": list(dict.fromkeys(persons)),
            "locations": list(dict.fromkeys(locations)),
            "orgs": list(dict.fromkeys(orgs))}

def build_prompt(text, temporal_candidates, entities, locale, timezone):
    examples = """
Example:
Text: "Hi Anna — dentist next Wed at 3pm, 30 minutes. See you!"

-> {
  "title": "Dentist appointment",
  "start": "2025-11-12T14:00:00+00:00",
  "end": "2025-11-12T14:30:00+00:00",
  "timezone": "Europe/Budapest",
  "location": null,
  "attendees": ["Anna"],
  "description": "From message: Hi Anna — dentist next Wed at 3pm, 30 minutes.",
  "reminders": [30],
  "recurrence": null,
  "confidence": 0.9
}
"""
    temporal_info = "\n".join([f"- '{m}' -> {dt.isoformat() if hasattr(dt,'isoformat') else str(dt)}" for (m, dt) in temporal_candidates])
    entities_info = json.dumps(entities)
    prompt = f"""
Extract a single event or todo from the text below. Always return valid JSON with keys:
title, start (ISO tz), end (ISO tz or null), timezone, location (or null), attendees (list), description, reminders (list minutes), recurrence (null or RFC-rrule), confidence (0.0-1.0)

Locale: {locale}
Timezone (user): {timezone}

Temporal candidates found:
{temporal_info or 'none'}

Entities (spaCy):
{entities_info}

Text:
\"\"\"{text}\"\"\"

{examples}

Return ONLY the JSON object (no explanation).
"""
    return prompt

async def call_openai_extract(prompt: str):
    if not client.api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    completion = client.chat.completions.create(
        model="gpt-4o-mini",  # change per availability
        messages=[
            {"role": "system", "content": "You are an assistant that extracts a single calendar/todo event from noisy text and returns strict JSON."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=700,
        temperature=0.0,
    )
    return completion.choices[0].message.content.strip()

async def extract_event_from_text(text: str, source: str = "unknown", source_meta: Optional[dict] = None,
                                  locale: str = "en", timezone: str = "UTC") -> Dict[str, Any]:
    working = strip_quoted_text(text)
    
    # Try to detect language if not provided
    if locale == "en" and source_meta:
        detected_locale = source_meta.get("locale", "en")
        if detected_locale and detected_locale != "en":
            locale = detected_locale
    
    # Load appropriate spaCy model based on locale
    # For now, we'll use English model for all, but this can be extended
    # In production, you'd load hu_core_news_sm for Hungarian, etc.
    entities = spaCy_entities(working)
    temporal_candidates = extract_temporal_candidates(working, timezone=timezone, locale=locale)
    start_dt = None
    end_dt = None
    if temporal_candidates:
        first_match, dt = temporal_candidates[0]
        if dt.tzinfo is None:
            dt = pytz.timezone(timezone).localize(dt)
        start_dt = dt
        dur_match = re.search(r"(\d+)\s*(minutes|mins|hours|hr|hour)s?", working, flags=re.I)
        if dur_match:
            v = int(dur_match.group(1))
            unit = dur_match.group(2).lower()
            if 'hour' in unit or 'hr' in unit:
                end_dt = start_dt + datetime.timedelta(hours=v)
            else:
                end_dt = start_dt + datetime.timedelta(minutes=v)
        else:
            end_dt = start_dt + datetime.timedelta(hours=1)
    prompt = build_prompt(working, temporal_candidates, entities, locale, timezone)
    try:
        llm_out = await call_openai_extract(prompt)
        parsed = json.loads(llm_out)
    except Exception:
        parsed = {
            "title": None,
            "start": format_iso(start_dt, timezone) if start_dt else None,
            "end": format_iso(end_dt, timezone) if end_dt else None,
            "timezone": timezone,
            "location": entities["locations"][0] if entities["locations"] else None,
            "attendees": entities["persons"],
            "description": working[:1000],
            "reminders": [30],
            "recurrence": None,
            "confidence": 0.4
        }
    if parsed.get("start") is None and start_dt:
        parsed["start"] = format_iso(start_dt, timezone)
    if parsed.get("end") is None and end_dt:
        parsed["end"] = format_iso(end_dt, timezone)
    parsed["raw_text_snippet"] = working[:400]
    parsed["source"] = source
    parsed["source_meta"] = source_meta
    if "confidence" not in parsed:
        parsed["confidence"] = 0.6 if parsed.get("start") else 0.2
    return parsed

def create_calendar_placeholder(event: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
    return {"id": f"evt_stub_{math.floor(datetime.datetime.utcnow().timestamp())}", **event}

