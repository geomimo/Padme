export interface User {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
  xp: number;
  streak: number;
  longest_streak: number;
  last_active_date: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  order: number;
  lesson_count: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  category_id: string;
  order: number;
  is_published: boolean;
  quiz_count: number;
}

export interface QuizOption {
  id: string;
  text: string;
  order: number;
}

export interface QuizOptionAdmin extends QuizOption {
  is_correct: boolean;
}

export interface QuizPublic {
  id: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  question: string;
  xp_reward: number;
  order: number;
  options: QuizOption[];
}

export interface QuizAdmin {
  id: string;
  lesson_id: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  question: string;
  explanation: string | null;
  xp_reward: number;
  order: number;
  options: QuizOptionAdmin[];
}

export interface DailySet {
  id: string;
  date: string;
  is_completed: boolean;
  xp_earned: number;
  quizzes: QuizPublic[];
}

export interface AnswerResponse {
  is_correct: boolean;
  explanation: string | null;
  xp_earned: number;
  correct_option_id: string | null;
}

export interface CompleteResponse {
  xp_earned: number;
  new_total_xp: number;
  streak: number;
  longest_streak: number;
  perfect_set: boolean;
  correct_count: number;
  total_count: number;
}

export interface CategoryProgress {
  category_id: string;
  category_name: string;
  icon: string | null;
  color: string | null;
  total_quizzes: number;
  correct_answers: number;
  completion_pct: number;
}

export interface DayActivity {
  date: string;
  completed: boolean;
}

export interface Progress {
  xp: number;
  streak: number;
  longest_streak: number;
  last_active_date: string | null;
  categories: CategoryProgress[];
  weekly_activity: DayActivity[];
}
