# Padme — User Guide

## Table of Contents

1. [What is Padme?](#what-is-padme)
2. [Getting Started](#getting-started)
   - [Create an Account](#create-an-account)
   - [Onboarding](#onboarding)
   - [The Dashboard](#the-dashboard)
3. [Daily Quiz](#daily-quiz)
   - [Starting Your Daily Set](#starting-your-daily-set)
   - [Answering Questions](#answering-questions)
   - [Question Types](#question-types)
   - [Feedback and Explanations](#feedback-and-explanations)
   - [Completing Your Set](#completing-your-set)
4. [XP and Streak System](#xp-and-streak-system)
   - [Earning XP](#earning-xp)
   - [Streak Bonuses](#streak-bonuses)
   - [Maintaining Your Streak](#maintaining-your-streak)
   - [Streak Freeze](#streak-freeze)
5. [Learning Content](#learning-content)
   - [Categories](#categories)
   - [Lessons](#lessons)
   - [Learning Paths](#learning-paths)
6. [Review Sessions](#review-sessions)
7. [Bookmarks](#bookmarks)
8. [Leaderboard](#leaderboard)
9. [Achievements](#achievements)
10. [History](#history)
11. [Profile](#profile)
12. [Test Plans](#test-plans)
13. [Admin Panel](#admin-panel)

---

## What is Padme?

Padme is a Duolingo-style learning platform for **Databricks**. It helps you build and retain knowledge about Databricks concepts through:

- A **daily quiz** of 5 questions, tailored to what you most need to practice
- An **XP and streak system** that rewards consistent daily learning
- **Spaced repetition** — questions you struggle with come back sooner; questions you know well are scheduled further out
- **Achievements and a leaderboard** to track milestones and compete with teammates

Padme covers 8 Databricks topic areas: Delta Lake, Apache Spark, MLflow, Databricks SQL, Unity Catalog, Workflows, AutoML, and Databricks Runtime.

---

## Getting Started

### Create an Account

1. Navigate to `http://localhost:3000` (or the URL provided by your admin)
2. Click **Get Started** or go to `/login`
3. Enter your email and a password, then click **Sign Up**

If an account already exists for your email, enter your credentials and click **Log In**.

### Onboarding

The first time you log in you will be guided through a short onboarding quiz. This:
- Introduces you to the question format
- Takes only a minute or two
- Does not affect your XP or streak

Complete it to unlock the full dashboard.

### The Dashboard

After logging in you land on the **Dashboard**, your home base. It shows:

| Section | What it shows |
|---------|--------------|
| **Today's Challenge** | Whether you have completed today's daily set |
| **XP Total** | Your lifetime XP points |
| **Current Streak** | Consecutive days with a completed set |
| **Category Progress** | Completion percentage per topic |
| **Weekly Activity** | Which days this week you practised |

From here you can jump straight into today's quiz or explore lessons.

---

## Daily Quiz

### Starting Your Daily Set

Click **Start Today's Quiz** on the dashboard, or navigate to **Quiz** in the sidebar.

Each day Padme selects **5 questions** from the topics you have already encountered or are scheduled to review, using a spaced repetition algorithm. The selection prioritises:

1. Questions that are overdue for review
2. New questions you have never seen
3. Questions scheduled for the future (fallback)

You get one set per day. The set resets at midnight.

### Answering Questions

Questions are presented one at a time. Read each question carefully, then select your answer. You cannot change an answer once submitted.

### Question Types

**Multiple Choice** — Select one of four options by clicking it.

**True / False** — Click **True** or **False**.

### Feedback and Explanations

After each answer Padme shows:
- Whether your answer was **correct** or **incorrect**
- The **correct answer** (if you were wrong)
- An **explanation** of why the answer is correct

Take time to read the explanations — they are the main learning moment.

### Completing Your Set

After the fifth question a **Completion Screen** appears showing:
- Total XP earned (including bonuses)
- Your updated streak
- Any new achievements unlocked

Your streak increases by 1 for that day, and the questions are fed into the spaced repetition scheduler to determine when you see them next.

---

## XP and Streak System

### Earning XP

| Event | XP |
|-------|----|
| Correct answer | 10 |
| Perfect set (5/5 correct) | +20 bonus |

XP bonuses from streaks are applied on top (see below).

### Streak Bonuses

Maintaining a daily practice streak multiplies your XP:

| Streak Length | Bonus |
|--------------|-------|
| 1–2 days | None |
| 3–6 days | +10% |
| 7–13 days | +20% |
| 14–29 days | +30% |
| 30+ days | +50% |

**Example:** A 7-day streak + a perfect set = (5 × 10 + 20) × 1.20 = **84 XP**

### Maintaining Your Streak

Your streak increases by 1 every calendar day you complete your daily set. If you miss a day without a streak freeze, your streak resets to 0.

### Streak Freeze

You start with **2 streak freezes**. Activating one protects your streak for a single missed day.

To use a streak freeze:
1. Go to **Profile**
2. Click **Use Streak Freeze**

Streak freezes do not stack — you cannot stockpile them above 2.

---

## Learning Content

### Categories

Navigate to **Learn** in the sidebar to browse the 8 Databricks topic categories:

- **Delta Lake** — ACID transactions, time travel, schema evolution
- **Apache Spark** — RDDs, DataFrames, Spark SQL, streaming
- **MLflow** — Experiment tracking, model registry, deployment
- **Databricks SQL** — SQL warehouses, dashboards, query optimisation
- **Unity Catalog** — Data governance, permissions, lineage
- **Databricks Workflows** — Job orchestration, multi-task jobs
- **AutoML** — Automated machine learning experiments
- **Databricks Runtime** — Cluster configuration, libraries, Photon

Each category card shows the number of lessons and your overall completion percentage.

### Lessons

Click a category to see its lessons. Each lesson:
- Covers a focused sub-topic
- Contains instructional content
- Has associated quiz questions that feed into your daily sets

Click **Start Lesson** to read through the material, or click **Quiz** to practise questions for that lesson directly.

### Learning Paths

**Paths** (sidebar link) offer curated sequences of lessons ordered from beginner to advanced within a topic. Following a path ensures you build knowledge in the right order.

Each path shows:
- Total number of lessons
- Your completion percentage
- A **Continue** button that takes you to the next unfinished lesson

---

## Review Sessions

Made mistakes in past quizzes? The **Review** section generates a session from questions you have answered incorrectly.

To start a review:
1. Click **Review** in the sidebar (or the **Review Mistakes** button on the dashboard)
2. Work through the session the same way as a daily set
3. Your SRS schedule is updated based on your review performance

Review sessions do not grant XP or affect your streak, but they do update the spaced repetition intervals, helping you improve on weak areas faster.

---

## Bookmarks

Save any quiz question for later by clicking the **Bookmark** icon during a quiz or on a lesson's quiz list.

View all your bookmarks under **Bookmarks** in the sidebar. From there you can:
- Read the question and its explanation
- Remove the bookmark when you feel confident

---

## Leaderboard

The **Leaderboard** shows the top 20 users by total XP, along with your own rank even if you are outside the top 20.

Rankings update in real time as users complete their daily sets.

---

## Achievements

Padme awards **badges** for reaching milestones. Open **Achievements** in the sidebar to see all available badges and which ones you have earned.

Example achievements:

| Badge | Condition |
|-------|-----------|
| First Quiz | Complete your first quiz |
| Perfect Set | Score 5/5 on a daily set |
| 7-Day Streak | Maintain a 7-day streak |
| 30-Day Streak | Maintain a 30-day streak |
| Category Master | Complete all lessons in a category |

Newly unlocked achievements are shown on the Completion Screen after each daily set.

---

## History

**History** (sidebar link) shows a log of all past daily set sessions with:
- Date
- Score (correct out of 5)
- XP earned
- Whether a streak was active

Use History to track your learning consistency over time.

---

## Profile

Your **Profile** page shows:
- Email address
- Total XP and rank
- Current and longest streak
- Streak freeze count
- Joined date

You can also use a streak freeze from this page.

---

## Test Plans

Administrators can create **Test Plans** — curated sets of questions assigned to users or teams. If your admin has assigned a test plan to you:

1. Go to **Test Plans** in the sidebar to see available plans
2. Click **Start** to begin a session
3. Answer all questions (no daily limit applies — test plans are separate from your daily set)
4. View results under **My Tests**

Test plans are typically used for certification preparation or team assessments.

---

## Admin Panel

> This section applies to users with the **admin** role only.

The admin panel at `/admin` provides a full CRUD interface for all content:

- **Users** — View, edit, or delete user accounts
- **Categories** — Create and manage topic categories
- **Lessons** — Add, edit, or remove lessons within categories
- **Quizzes** — Write questions, add options, mark correct answers, write explanations
- **Test Plans** — Create and assign structured assessments

### Adding New Quiz Content

1. Log in to `/admin` with your admin credentials
2. Go to **Lessons** → create a lesson inside the target category
3. Go to **Quizzes** → create a question linked to that lesson
4. Add **Quiz Options** with at least one marked `is_correct = true`
5. Write a clear **Explanation** — this is what users learn from
6. Set `is_published = true` to make the quiz available in daily sets

### Seeded Admin Account

The default development admin account is:

| Field | Value |
|-------|-------|
| Email | `admin@padme.dev` |
| Password | `admin123` |

Change this password before deploying to a shared or production environment.
