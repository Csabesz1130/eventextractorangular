# Quick Start Guide

## Starting the Application

### 1. Backend (Extraction Service)

Open a terminal and run:

```powershell
cd api/extraction-service
.venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
$env:OPENAI_API_KEY="sk-your-key-here"
uvicorn main:app --reload --port 8080
```

The backend will be available at `http://localhost:8080`

### 2. Frontend (Angular App)

Open another terminal and run:

```powershell
cd web
npm start
```

Or if you prefer:
```powershell
cd web
ng serve
```

The frontend will be available at `http://localhost:4200`

### 3. Using the App

1. Open `http://localhost:4200` in your browser
2. Click "Quick Add" button in the toolbar
3. Paste some text like: "Hi Tom, let us meet next Friday at 3pm at Central Cafe. I will bring slides. - Anna"
4. Click "Extract"
5. The event suggestion will appear in the Inbox
6. Click "Approve" to add it to your calendar (stub for now)

### Features

- **Dark Mode**: Toggle with the dark mode icon in the toolbar
- **Quick Add**: Fast paste → extract workflow
- **Event Inbox**: View all AI-extracted event suggestions
- **Connectors**: Connect Gmail/Google Calendar (coming soon)
- **Smooth Animations**: Buttery smooth UI interactions

### Troubleshooting

- If Angular server doesn't start, make sure you're in the `web` directory
- If backend errors, check that `OPENAI_API_KEY` is set
- If API calls fail, ensure backend is running on port 8080
- The proxy configuration forwards `/api/*` requests to `localhost:8080`

