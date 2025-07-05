# FlashMind - AI-Powered Flashcard Generator 🧠

Transform any content into smart, AI-generated flashcards. Upload PDFs, images, or YouTube videos, and study smarter with adaptive quizzes, performance tracking, and a clean, modern UI.

---

## 🚀 Quick Deploy

### Deploy to Vercel (Recommended)

1. **Fork this repository**
2. Go to [vercel.com](https://vercel.com)
3. Click **"New Project"**
4. Import your forked repo
5. Configure the environment variables (see below)
6. Hit **Deploy**

---

## 🔧 Environment Variables

Add these in your Vercel **Project Settings > Environment Variables**:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE=your-service-role-key

# OpenAI API Key
OPENAI_KEY=sk-********************************


🧪 Local Development
# Clone the repo
git clone https://github.com/yourusername/flashmind.git
cd flashmind

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# (Add your env vars to .env.local)

# Run dev server
npm run dev

📋 Setup Checklist
 GitHub repository forked

 Supabase project created

 Database tables initialized (scripts/create-tables.sql)

 Google OAuth configured in Supabase

 OpenAI API key obtained

 Environment variables set in Vercel

 Authorized domain added to Supabase Auth settings

📚 Features
🔐 Google Authentication via Supabase Auth

📤 Multi-Format Upload: PDFs, Images, YouTube videos

🤖 AI Flashcard Generation with GPT-4 and GPT-4 Vision

📊 Progress Tracking and Performance Analytics

🎯 Adaptive Quiz Mode based on user knowledge level

🎨 Modern UI/UX with Framer Motion and Tailwind CSS

📱 Fully Responsive for mobile, tablet, and desktop

🏗️ Tech Stack
Layer	Tech Used
Frontend	Next.js 14, TypeScript, Tailwind CSS
Backend	Next.js API Routes
Auth	Supabase Auth (Google OAuth)
AI Engine	OpenAI GPT-4 + GPT-4 Vision
Database	PostgreSQL (via Supabase)
DevOps	Vercel (CI/CD + Hosting)
Animations	Framer Motion


📁 Project Structure
flashmind/
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   ├── auth/               # Auth pages (login, signup)
│   ├── dashboard/          # User dashboard
│   ├── generate/           # Flashcard generation flow
│   └── globals.css         # Global styles
├── components/             # UI components
│   └── ui/                 # Buttons, inputs, cards, etc.
├── lib/                    # Utilities and API clients
├── scripts/                # DB initialization scripts
└── public/                 # Static assets

🔐 Security Highlights
Supabase Row Level Security (RLS)

CSRF protection and secure HTTP headers

Environment variable validation

OAuth login with restricted domain access

🙌 Contributing
We love community contributions! Here's how you can help:

Fork the repository

Create a branch (git checkout -b feature/awesome-feature)

Commit your changes (git commit -m 'Add awesome feature')

Push to GitHub (git push origin feature/awesome-feature)

Create a Pull Request and describe your changes

📄 License
This project is licensed under the MIT License.
See the LICENSE file for more information.

🙏 Acknowledgements
OpenAI for providing GPT models

Supabase for instant backend

Vercel for blazing-fast deployment

Tailwind CSS and Framer Motion for stunning UI

You – the learner, the builder, the future 🤍

Built with ❤️ to make learning fun, fast, and unforgettable.


Let me know if you'd like:
- a downloadable `.md` file
- a SASS version of the UI
- sample `.env.local`
- database schema SQL file (`create-tables.sql`)  
Happy hacking!
