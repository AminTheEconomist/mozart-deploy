# External data sources

The `/api/analyze` endpoint accepts an optional `external` object on each
session. Drop any of these in to enrich Claude's recommendations.

```jsonc
// POST /api/analyze
{
  "session": {
    "timestamp": "...",
    "theme": "vancouver-local",
    "responses": [...],
    "external": {           // <— this is the optional bit
      "uber":  { ... },
      "maps":  { ... },
      "tesla": { ... },
      "grok":  { ... }
    }
  }
}
```

The whole `external` block gets serialised into the prompt verbatim, so Claude
sees it. To make the model *use* it well, add a sentence to `INSTRUCTIONS` in
`server.js` describing each new source and extend `INSIGHTS_TOOL` with any new
output fields it unlocks (e.g. `eta_warning`, `charging_stop_suggestion`).

---

## Uber driver app

Manual paste while waiting for pickup, or scraped via an iOS Shortcut → POST.

```json
{
  "uber": {
    "pickup": "Downtown · Yaletown",
    "destination": "YVR",
    "estimated_minutes": 32,
    "fare_estimate": 28.50,
    "surge_multiplier": 1.4,
    "passenger_rating_history": 4.93,
    "trip_count_with_driver": 0
  }
}
```

**Status**: stub. Not wired yet.

---

## Google Maps / Apple Maps

Route + traffic context. Pull via Maps SDK on the tablet, or expose an iOS
Shortcut that GETs current directions and posts them.

```json
{
  "maps": {
    "route_type": "fastest",
    "traffic_level": "moderate",
    "alternate_scenic_minutes": 38,
    "points_of_interest_along_route": [
      "Stanley Park",
      "Granville Island Market"
    ]
  }
}
```

**Status**: stub.

---

## Tesla in-car

Car state + nav via Tesla Fleet API (auth + token refresh) or TeslaMate.

```json
{
  "tesla": {
    "battery_pct": 64,
    "range_km": 287,
    "charging_needed_before_eod": false,
    "destination_arrival_eta": "9:42 PM",
    "ambient_temp_c": 16,
    "currently_playing_genre": "ambient electronic"
  }
}
```

**Status**: stub. Easiest path: a small Python helper that polls the Fleet API
on a 30 s loop and writes `data/tesla.json`, which `server.js` could read on each
`/api/analyze` call.

---

## Grok (xAI) or another LLM for second opinion

Same session, different model. Server can fan out and surface disagreement
when the two reads diverge meaningfully.

```json
{
  "grok": {
    "raw_response": "...",
    "verdict": "high_tip",
    "confidence": 0.72
  }
}
```

**Status**: stub.

---

## How to actually wire one of these in

1. **Capture** the data on whatever device produces it (iOS Shortcut, Tesla
   helper script, browser extension over the Uber driver web app, etc.).
2. **POST** it to a new endpoint like `/api/external/tesla` that writes to
   `data/tesla.json` — *or* the tablet can just include the snapshot in
   `session.external` when the questionnaire finishes.
3. In `server.js`, on `/api/analyze`, merge the latest from `data/` into
   `session.external` before formatting the prompt.
4. **Tell Claude** about the new field by editing `INSTRUCTIONS` in `server.js`
   and (optionally) adding new output fields to `INSIGHTS_TOOL`.

That's the whole pattern. Any new data source follows the same five steps:
capture → post → store → merge → instruct.
