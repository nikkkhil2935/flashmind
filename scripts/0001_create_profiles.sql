-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'Hhs8/S8Ukyziy4tFjW0cAM/W9OK1SwAjeO1wj2caxiedn/Vzg/cYseizPRjc6mGwnIdqDVaCo30VgoHsEv88Lg==';

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    study_streak INTEGER DEFAULT 0,
    total_study_time INTEGER DEFAULT 0, -- in minutes
    preferred_difficulty TEXT DEFAULT 'medium' CHECK (preferred_difficulty IN ('easy', 'medium', 'hard')),
    daily_goal INTEGER DEFAULT 30, -- minutes per day
    timezone TEXT DEFAULT 'UTC'
);

-- Create flashcard_sets table
CREATE TABLE IF NOT EXISTS public.flashcard_sets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    topic TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_studied TIMESTAMP WITH TIME ZONE,
    is_public BOOLEAN DEFAULT FALSE,
    total_cards INTEGER DEFAULT 0,
    mastered_cards INTEGER DEFAULT 0,
    average_accuracy DECIMAL(5,2) DEFAULT 0.00
);

-- Create flashcards table
CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    set_id UUID REFERENCES public.flashcard_sets(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_reviewed TIMESTAMP WITH TIME ZONE,
    next_review TIMESTAMP WITH TIME ZONE,
    review_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    accuracy DECIMAL(5,2) DEFAULT 0.00,
    ease_factor DECIMAL(3,2) DEFAULT 2.50,
    interval_days INTEGER DEFAULT 1,
    is_mastered BOOLEAN DEFAULT FALSE
);

-- Create quiz_sessions table
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER DEFAULT 0,
    score_percentage DECIMAL(5,2) DEFAULT 0.00,
    time_spent INTEGER DEFAULT 0, -- in seconds
    hints_used INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    metadata JSONB DEFAULT '{}'
);

-- Create quiz_answers table
CREATE TABLE IF NOT EXISTS public.quiz_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.quiz_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('multiple-choice', 'fill-blank', 'true-false')),
    user_answer TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent INTEGER DEFAULT 0, -- in seconds
    hint_used BOOLEAN DEFAULT FALSE,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_sessions table
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    session_type TEXT NOT NULL CHECK (session_type IN ('flashcard_review', 'quiz', 'general_study')),
    subject TEXT,
    topic TEXT,
    duration_minutes INTEGER NOT NULL,
    cards_reviewed INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    total_answers INTEGER DEFAULT 0,
    accuracy DECIMAL(5,2) DEFAULT 0.00,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_statistics table
CREATE TABLE IF NOT EXISTS public.user_statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    study_time_minutes INTEGER DEFAULT 0,
    flashcards_reviewed INTEGER DEFAULT 0,
    quizzes_completed INTEGER DEFAULT 0,
    average_quiz_score DECIMAL(5,2) DEFAULT 0.00,
    streak_days INTEGER DEFAULT 0,
    subjects_studied TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL,
    requirement_type TEXT NOT NULL, -- 'streak', 'score', 'count', 'time'
    requirement_value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Insert default achievements
INSERT INTO public.achievements (code, name, description, icon, category, requirement_type, requirement_value) VALUES
('first_quiz', 'First Quiz', 'Complete your first quiz', '🎯', 'quiz', 'count', 1),
('quiz_master', 'Quiz Master', 'Complete 10 quizzes', '🏆', 'quiz', 'count', 10),
('perfect_score', 'Perfect Score', 'Get 100% on a quiz', '⭐', 'quiz', 'score', 100),
('study_streak_7', '7-Day Streak', 'Study for 7 consecutive days', '🔥', 'streak', 'streak', 7),
('study_streak_30', '30-Day Streak', 'Study for 30 consecutive days', '💪', 'streak', 'streak', 30),
('flashcard_master', 'Flashcard Master', 'Review 100 flashcards', '📚', 'flashcard', 'count', 100),
('speed_learner', 'Speed Learner', 'Complete 50 flashcards in one session', '⚡', 'flashcard', 'count', 50),
('dedicated_student', 'Dedicated Student', 'Study for 10 hours total', '📖', 'time', 'time', 600)
ON CONFLICT (code) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Flashcard sets policies
CREATE POLICY "Users can view own flashcard sets" ON public.flashcard_sets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own flashcard sets" ON public.flashcard_sets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flashcard sets" ON public.flashcard_sets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own flashcard sets" ON public.flashcard_sets FOR DELETE USING (auth.uid() = user_id);

-- Flashcards policies
CREATE POLICY "Users can view own flashcards" ON public.flashcards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own flashcards" ON public.flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flashcards" ON public.flashcards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own flashcards" ON public.flashcards FOR DELETE USING (auth.uid() = user_id);

-- Quiz sessions policies
CREATE POLICY "Users can view own quiz sessions" ON public.quiz_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own quiz sessions" ON public.quiz_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quiz sessions" ON public.quiz_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Quiz answers policies
CREATE POLICY "Users can view own quiz answers" ON public.quiz_answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own quiz answers" ON public.quiz_answers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Study sessions policies
CREATE POLICY "Users can view own study sessions" ON public.study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own study sessions" ON public.study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User statistics policies
CREATE POLICY "Users can view own statistics" ON public.user_statistics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own statistics" ON public.user_statistics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own statistics" ON public.user_statistics FOR UPDATE USING (auth.uid() = user_id);

-- User achievements policies
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Achievements are public (read-only)
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_user_id ON public.flashcard_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON public.flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_set_id ON public.flashcards(set_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON public.quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_session_id ON public.quiz_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_statistics_user_id ON public.user_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_statistics_date ON public.user_statistics(date);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);

-- Create functions for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update flashcard set statistics
CREATE OR REPLACE FUNCTION update_flashcard_set_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.flashcard_sets 
  SET 
    total_cards = (
      SELECT COUNT(*) 
      FROM public.flashcards 
      WHERE set_id = COALESCE(NEW.set_id, OLD.set_id)
    ),
    mastered_cards = (
      SELECT COUNT(*) 
      FROM public.flashcards 
      WHERE set_id = COALESCE(NEW.set_id, OLD.set_id) AND is_mastered = true
    ),
    average_accuracy = (
      SELECT COALESCE(AVG(accuracy), 0) 
      FROM public.flashcards 
      WHERE set_id = COALESCE(NEW.set_id, OLD.set_id) AND review_count > 0
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.set_id, OLD.set_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for flashcard set statistics
CREATE TRIGGER update_set_stats_on_flashcard_change
  AFTER INSERT OR UPDATE OR DELETE ON public.flashcards
  FOR EACH ROW EXECUTE FUNCTION update_flashcard_set_stats();
