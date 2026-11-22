# SmartGrader — AI-Powered Short Answer Evaluation System

**Project Domain / Category:** Machine Learning / Natural Language Processing (NLP) / Full-Stack Web Application  
**Public Docker Hub Images:**
- **Frontend Image:** `ainulattique/smartgrader-frontend:latest` ([Docker Hub](https://hub.docker.com/r/ainulattique/smartgrader-frontend))
- **Backend Image:** `ainulattique/smartgrader-backend:latest` ([Docker Hub](https://hub.docker.com/r/ainulattique/smartgrader-backend))

---

## 1. Project Overview
**SmartGrader** is an intelligent automated evaluation system designed to assess short-answer responses using open-source Natural Language Processing (NLP) and machine learning techniques—with **zero paid API dependencies**.

The system implements dual evaluation approaches:
1. **Rule-Based Lexical Model:** Uses `spaCy` (`en_core_web_sm`) lemmatization, stop-word filtering, noun-chunk extraction, and `scikit-learn` TF-IDF cosine matching for precise term coverage.
2. **Neural / Semantic Model:** Uses dense vector representations (`all-MiniLM-L6-v2` / TF-IDF semantic similarity) to measure conceptual meaning beyond exact phrasing.

Evaluated against a real-world **Automatic Short Answer Grading (ASAG)** dataset of **4,275 records** (leakage-free **4,000 train / 275 test split**), SmartGrader generates predicted scores, similarity percentages, matched/missing concepts, and constructive feedback while tracking **Mean Absolute Error (MAE)** and **RMSE** against human teacher marks.

---

## 2. Technology Stack (100% Free & Open-Source)

| Layer | Technologies & Libraries |
| :--- | :--- |
| **Frontend UI/UX** | Next.js 14 (App Router), TypeScript, Material UI (`@mui/material`), shadcn/ui, Tailwind CSS, Lucide Icons |
| **Backend REST API** | Python 3.10, Flask, Flask-CORS, Gunicorn |
| **AI / NLP Engines** | spaCy (`en_core_web_sm`), Scikit-Learn (TF-IDF & Cosine Similarity), Sentence-Transformers (`all-MiniLM-L6-v2`), Pandas, NumPy |
| **Database & Storage** | SQLite 3 (persisted via Docker named volume `smartgrader_data`) |
| **Containerization** | Docker, Docker Compose (Pre-built images hosted on Docker Hub) |

---

## 3. Quick Start — Run Directly from Docker Hub (No Source Code Required)

Anyone with **Docker Desktop** (or Docker Engine) installed can launch the complete application in seconds without building from source.

### Step 1: Create `docker-compose.yml`
Save the following configuration into a file named `docker-compose.yml`:

```yaml
services:
  backend:
    image: ainulattique/smartgrader-backend:latest
    container_name: smartgrader-backend
    ports:
      - "5000:5000"
    volumes:
      - smartgrader_data:/app/data
    environment:
      - FLASK_ENV=production
      - DB_PATH=/app/data/smartgrader.db
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 15s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  frontend:
    image: ainulattique/smartgrader-frontend:latest
    container_name: smartgrader-frontend
    ports:
      - "3000:3000"
    environment:
      - BACKEND_URL=http://backend:5000
      - NODE_ENV=production
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped

volumes:
  smartgrader_data:
```

### Step 2: Pull & Launch Containers
Run the following command in the directory containing `docker-compose.yml`:

```bash
docker compose up -d
```

### Step 3: Access the Application
- **Web Application (Frontend Studio):** [http://localhost:3000](http://localhost:3000)
- **Backend Health Endpoint:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 4. Application Modules & Pages
1. **Home (`/`):** Project overview, interactive architecture cards, Dark/Light mode switcher, and quick navigation.
2. **Evaluation Studio (`/evaluate`):** Input question, model answer, student answer, and total marks; toggle between Rule-Based and Semantic models (or compare side-by-side); view radial similarity score, matched/missing keywords, and automated feedback.
3. **Dataset Explorer (`/dataset`):** Drag-and-drop `.csv` / `.xlsx` upload with schema validation, 4,000 train / 275 test split tagging, and searchable Material UI data grid.
4. **Analytics Dashboard (`/dashboard`):** KPI cards (Total Evaluations, MAE, RMSE, Accuracy), Predicted vs. Teacher Marks visual comparison charts, and evaluation audit logs.

---

## 5. REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/evaluate` | Evaluates a student answer against a model answer and returns predicted marks, similarity score, and feedback. |
| `POST` | `/api/upload` | Validates and ingests `.csv` or `.xlsx` ASAG datasets into SQLite and benchmarks train/test split metrics. |
| `GET` | `/api/dataset` | Retrieves paginated dataset records with `train` / `test` split labels. |
| `GET` | `/api/history` | Returns past evaluation logs and aggregated MAE / RMSE comparison statistics. |
| `GET` | `/api/health` | Container health check returning backend readiness status. |
