# SyncRunize — Installation Guide

SyncRunize is a running companion app with hazard reporting, route planning, and community features. The system is composed of four services that must all be running for the app to work fully.

| Service | Tech | Default Port |
|---|---|---|
| `algorithm-engine` | Python (FastAPI) | `8000` |
| `backend` | Node.js (Express) | `3000` |
| `syncrunize-website` | Ionic React (Vite) | `5173` |
| `syncrunize-mobile-app` | Ionic React + Capacitor | Android Studio / device |

> **Start order matters:** Algorithm Engine → Backend → Website/Mobile

---

## Prerequisites

Install all of the following before proceeding.

| Tool | Minimum Version | Download |
|---|---|---|
| Node.js | 18.x or higher | https://nodejs.org |
| npm | 9.x or higher | Included with Node.js |
| Python | 3.10 or higher | https://python.org |
| pip | latest | Included with Python |
| Ionic CLI | latest | `npm install -g @ionic/cli` |
| Android Studio | Ladybug (2024.2.x) | https://developer.android.com/studio |
| Git | any | https://git-scm.com |

Verify your installations:

```bash
node -v
npm -v
python --version
pip --version
ionic --version
```

---

## Required API Keys & Credentials

You need to obtain your own credentials for the following services. **Do not use the team's credentials** — each developer should set up their own for local development.

### 1. Supabase (Database)
1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Create a new project.
3. Go to **Project Settings → API**.
4. Copy your **Project URL**, **anon/public key**, and **service_role key**.
5. Go to **Project Settings → Database** and copy the **Connection String** (URI format).
6. Import the database schema — see the [Database Setup](#database-setup) section below.

### 2. Mapbox (Maps & Routing)
1. Go to [mapbox.com](https://mapbox.com) and create a free account.
2. Go to **Tokens** and create a new public token.
3. Copy the token (starts with `pk.`).

### 3. Firebase (Push Notifications) — Optional for local dev
1. Go to [Firebase Console](https://console.firebase.google.com) and create a project.
2. Add an Android app with package name `com.app.syncrunize`.
3. Download `google-services.json` — place it in `syncrunize-mobile-app/android/app/`.
4. Go to **Project Settings → Cloud Messaging** and copy your Android channel ID.

### 4. OpenAI — Optional
1. Go to [platform.openai.com](https://platform.openai.com) and create an account.
2. Generate an API key under **API Keys**.

### 5. Redis — Optional (for caching)
You can run Redis locally with Docker (`docker run -p 6379:6379 redis`) or skip it — the backend will still run without it, just without caching.

---

## Database Setup

The app uses **Supabase (PostgreSQL)**. You need to run the schema migrations on your own Supabase project.

1. In your Supabase dashboard, go to **SQL Editor**.
2. Run the SQL files in this order from `backend/sql/migrations/`:

```
000_performance_optimization_complete.sql
001_add_batch_alert_type.sql
002_add_performance_indexes.sql
003_optimized_query_functions_FIXED.sql
004_hazard_confirmations.sql
005_hazard_time_decay.sql
006_add_deleted_at_column.sql
007_add_cached_address.sql
```

Also run:
```
backend/sql/notifications.sql
backend/sql/notification_alterations.sql
backend/sql/settings_and_preferences.sql
backend/sql/device_tokens.sql
```

> You can paste each file's contents into the Supabase SQL Editor and click **Run**.

---

## 1. Algorithm Engine (Python / FastAPI)

**Run this first.**

### Navigate to the folder

```bash
cd algorithm-engine
```

### Create a virtual environment

```bash
python -m venv venv

# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### Install dependencies

```bash
pip install -r requirements.txt
```

> The first run will download the `all-MiniLM-L6-v2` sentence transformer model (~80MB). This is normal.

### Create your `.env` file

Create a file named `.env` inside the `algorithm-engine/` folder:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
MAPBOX_ACCESS_TOKEN=pk.your-mapbox-token
```

### Run the server

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The algorithm engine is running when you see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

You can verify it at: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 2. Backend (Node.js / Express)

**Run this second, after the algorithm engine is up.**

### Navigate to the folder

```bash
cd backend
```

### Install dependencies

```bash
npm install
```

### Create your `.env` file

Create a file named `.env` inside the `backend/` folder:

```env
# Supabase (required)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Algorithm Engine (required)
ALGORITHM_ENGINE_URL=http://localhost:8000

# Maps (required)
MAP_SNAPSHOT_PROVIDER=mapbox
MAPBOX_ACCESS_TOKEN=pk.your-mapbox-token

# OpenAI (optional - AI route summaries)
OPENAI_API_KEY=sk-your-openai-key

# Redis (optional - caching)
REDIS_URL=redis://localhost:6379

# Firebase Push Notifications (optional)
FCM_ANDROID_CHANNEL_ID=your-fcm-channel-id

# Server
PORT=3000
```

### Run the server

```bash
npm start
```

The backend is running when you see:
```
✅ Environment validation passed!
Server running on port 3000
```

You can verify it at: [http://localhost:3000](http://localhost:3000)

> API documentation is available at [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

---

## 3. Web App (Ionic React)

**Run this after the backend is up.**

### Navigate to the folder

```bash
cd syncrunize-website
```

### Install dependencies

```bash
npm install
```

### Create your `.env` file

Create a file named `.env` inside the `syncrunize-website/` folder:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:3000
VITE_MAPBOX_ACCESS_TOKEN=pk.your-mapbox-token
```

### Run the development server

```bash
npm run dev
```

Open your browser at: [http://localhost:5173](http://localhost:5173)

---

## 4. Mobile App (Ionic React + Capacitor + Android Studio)

### Navigate to the folder

```bash
cd syncrunize-mobile-app
```

### Install dependencies

```bash
npm install
```

### Create your `.env` file

Create a file named `.env` inside the `syncrunize-mobile-app/` folder:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://10.0.2.2:3000
VITE_MAPBOX_ACCESS_TOKEN=pk.your-mapbox-token
```

> **Important:** Use `http://10.0.2.2:3000` (not `localhost`) as the API base URL when running on an Android emulator. `10.0.2.2` is the Android emulator's alias for your host machine's `localhost`.

### Build the web assets

```bash
npm run build
```

### Sync to Android

```bash
npx cap sync android
```

### Set up Firebase (Push Notifications)

Place your `google-services.json` file (downloaded from Firebase Console) at:
```
syncrunize-mobile-app/android/app/google-services.json
```

### Open in Android Studio

```bash
npx cap open android
```

This will open the project in Android Studio. 

### Run on Emulator or Device

**Using an emulator:**
1. In Android Studio, open the **Device Manager** (toolbar → device icon).
2. Create a virtual device: Pixel 6, API Level 33 or higher.
3. Click the green **Run** button (▶) or press `Shift + F10`.

**Using a physical Android device:**
1. Enable **Developer Options** on your phone: Settings → About Phone → tap "Build Number" 7 times.
2. Enable **USB Debugging** in Developer Options.
3. Connect your phone via USB.
4. Select your device in Android Studio's device dropdown and click **Run**.

> **First launch may be slow** — Android Studio needs to build the Gradle project. Subsequent runs are faster.

---

## Running Everything Together

Open **4 separate terminal windows** and run each command in its own terminal:

**Terminal 1 — Algorithm Engine:**
```bash
cd algorithm-engine
source venv/bin/activate   # or venv\Scripts\activate on Windows
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Backend:**
```bash
cd backend
npm start
```

**Terminal 3 — Website:**
```bash
cd syncrunize-website
npm run dev
```

**Terminal 4 — Mobile (optional, or use Android Studio):**
```bash
cd syncrunize-mobile-app
npm run build && npx cap sync android
# Then open Android Studio and run from there
```

---

## Troubleshooting

**Backend crashes immediately on startup**
The backend validates all required environment variables on startup. Check the terminal output for lines starting with `❌`. Ensure your `.env` file is inside the `backend/` folder and all required keys are filled in.

**Algorithm engine can't connect to Supabase**
Double-check `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `algorithm-engine/.env`. The anon key (not the service role key) goes here.

**Mobile app can't reach the backend**
Make sure you're using `http://10.0.2.2:3000` in the mobile `.env`, not `localhost`. Also confirm the backend is running in Terminal 2.

**`sentence_transformers` install fails**
Try upgrading pip first: `pip install --upgrade pip`, then retry `pip install -r requirements.txt`.

**Android Studio Gradle build fails**
Go to **File → Sync Project with Gradle Files** and try again. Make sure Android SDK Platform 33+ is installed via **SDK Manager**.

**Google Sign-In not working on mobile**
Ensure your `google-services.json` is placed at `syncrunize-mobile-app/android/app/` and that you've added your app's SHA-1 fingerprint in the Firebase Console under your Android app settings.
