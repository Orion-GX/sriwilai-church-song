# Setlist Builder Flow

This document defines the fullstack flow for the Setlist Detail / Builder experience.

## Modes

- Guest mode (`/setlists/*`)
  - stored in local storage key `ccp-setlists-guest`
  - max 5 setlists per device
  - supports reorder, key change, transition notes, presentation mode, public link simulation
- Logged-in mode (`/dashboard/setlists/*`)
  - persisted via backend API
  - unlimited setlists
  - supports reorder, per-song updates, visibility and public link generation

## Backend Endpoints

- `GET /api/v1/app/setlists/personal`
- `POST /api/v1/app/setlists/personal`
- `GET /api/v1/app/setlists/personal/:id`
- `PATCH /api/v1/app/setlists/personal/:id`
- `POST /api/v1/app/setlists/personal/:id/song-items`
- `PATCH /api/v1/app/setlists/personal/:id/song-items/:itemId`
- `PATCH /api/v1/app/setlists/personal/:id/reorder`
- `PATCH /api/v1/app/setlists/personal/:id/visibility`
- `POST /api/v1/app/setlists/personal/:id/public-link`
- `GET /api/v1/app/setlists/public/:slug`

## Public Behavior

- Public setlist response is available only when:
  - `isPublic=true`
  - `shareToken` matches route slug
- If disabled or invalid slug, backend returns not found and frontend shows unavailable state.

## Data Shape Highlights

- Setlist fields:
  - `title`, `description`, `serviceDate`, `location`, `durationMinutes`, `teamName`
  - `isPublic`, `publicSlug/publicToken/publicUrl`
  - `presentationLayout` (`vertical` | `horizontal`)
  - `songs[]`
- Song item fields:
  - `songId`, `title`, `artist`, `originalKey`, `selectedKey`, `bpm`, `order`
  - `transitionNotes`, `notes`, `capo`, `duration`, optional `arrangement`/`version`
