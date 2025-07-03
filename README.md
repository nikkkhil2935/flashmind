# FlashMind 🧠

An intelligent flashcard learning platform combining document-style note-taking with spaced repetition and AI-powered flashcard generation.

## 🚀 Features

- **Rich Text Editor** — Like Google Docs or Word, for creating study notes.
- **Automated Flashcard Generation** — Uses OpenAI (or your chosen AI endpoint) to convert notes into Q&A flashcards.
- **Spaced Repetition System (SRS)** — Optimizes review schedules to help retention.
- **Full CRUD** — Create, read, update, and delete flashcards and documents.
- **Responsive & Intuitive UI** — Cross-device friendly.

## 💡 Why FlashMind?

Inspired by Anki, FlashMind boosts learning efficiency by blending familiar document editing with smart flashcard creation and advanced scheduling algorithms.

---

## 🛠️ Technology Stack

| Layer       | Tech Stack                      |
|-------------|---------------------------------|
| Frontend    | Angular, HTML, CSS, TypeScript  |
| UI Library  | PO-UI (PrimeNG, PO UI, etc.)   |
| Backend     | Java, Spring Boot              |
| Database    | PostgreSQL                     |
| AI API      | OpenAI API                     |
| DevOps      | Docker, Docker Compose         |

---

## 🔧 Getting Started

### Prerequisites

- Docker & Docker Compose installed
- [OpenAI API key] or AI endpoint credentials
- A running PostgreSQL DB (or configured in Docker Compose)

### Setup Steps

1. **Clone the repo**
   ```bash
   git clone https://github.com/nikkkhil2935/flashmind.git
   cd flashmind


Create a .env file (place next to docker-compose.yml) with:
OPENAI_API_KEY=your_key_here
SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/flashmind
SPRING_DATASOURCE_USERNAME=your_pg_user
SPRING_DATASOURCE_PASSWORD=your_pg_password

Launch everything with Docker Compose

docker-compose up -d
Access the app

Frontend: http://localhost:4200

Backend API: http://localhost:8080/api

🧠 Usage
Sign up / log in.

Create or edit a document using the rich-text editor.

Click “Generate Flashcards” to use AI or create manually.

Study flashcards in SRS mode daily.

Track your study analytics and progress.

🧩 Extending the App
🔧 Swap AI Engine — My setup uses OpenAI, but you can plug in any AI source.

🌐 Add Users/Roles — Extend backend to support multiple user profiles.

🌍 Internationalization — Translate UI to other languages.

🔒 Security — Implement JWT, OAuth, etc.

📱 Mobile Version — Use Ionic or other frameworks to port to mobile.

✅ Running Tests
bash
Copy
Edit
# Backend (if tests are setup)
cd FlashMindAPI
./gradlew test

# Frontend
cd FlashMindClient
npm install
npm test
📝 Environmental Variables
OPENAI_API_KEY: Your OpenAI key

SPRING_DATASOURCE_URL: JDBC URL to Postgres

SPRING_DATASOURCE_USERNAME

SPRING_DATASOURCE_PASSWORD

(Add any other required env vars here)

🚢 Deployment
Build Docker images:

bash
Copy
Edit
docker-compose build
Push to container registry (e.g., Docker Hub).

Deploy on cloud providers like AWS ECS, GCP Cloud Run, Azure, or DigitalOcean.

📄 License
Distributed under the MIT License. See LICENSE file for details.

📬 Contact
For questions or feedback, reach out:

GitHub profile: nikkkhil2935



