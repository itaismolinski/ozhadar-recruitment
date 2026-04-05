# 🏗️ Oz Hadar Group — Recruitment System
## הוראות הקמה · Setup Guide

---

## שלב 1 — Supabase (מסד הנתונים)

1. פתח חשבון חינמי: https://supabase.com → "Start your project"
2. צור project חדש — שמור את הסיסמה
3. לאחר יצירה (כ-2 דקות), לחץ על **SQL Editor** בצד שמאל
4. לחץ **New Query**
5. העתק את כל התוכן מהקובץ `supabase/schema.sql` ← הדבק ← לחץ **Run**
6. לחץ **Storage** → ודא שה-bucket `candidate-docs` נוצר
   - אם לא נוצר: לחץ **New bucket** → שם: `candidate-docs` → Private

**קבלת מפתחות:**
- לחץ **Settings** (גלגל שיניים) → **API**
- העתק:
  - `Project URL` → זה `VITE_SUPABASE_URL`
  - `anon public` key → זה `VITE_SUPABASE_ANON_KEY`

---

## שלב 2 — GitHub

1. פתח https://github.com → **New repository**
2. שם: `ozhadar-recruitment` → Public → **Create**
3. העלה את כל הקבצים של הפרויקט לrepo:
   - גרור את כל התיקייה ל-GitHub, או השתמש ב-GitHub Desktop

---

## שלב 3 — משתני סביבה (Environment Variables)

1. צור קובץ `.env` בתיקייה הראשית של הפרויקט:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
2. **חשוב:** הוסף `.env` לקובץ `.gitignore` (ראה למטה)

---

## שלב 4 — Vercel (פריסה)

1. פתח https://vercel.com → Sign Up with GitHub
2. לחץ **Add New Project** → בחר את הrepository
3. לפני Deploy, לחץ **Environment Variables** והוסף:
   - `VITE_SUPABASE_URL` = הURL מ-Supabase
   - `VITE_SUPABASE_ANON_KEY` = המפתח מ-Supabase
4. לחץ **Deploy**
5. אחרי ~1 דקה — תקבל URL כמו `ozhadar-recruitment.vercel.app`

---

## שלב 5 — יצירת משתמשים לצוות

1. ב-Supabase → **Authentication** → **Users** → **Invite User**
2. הכנס אימייל של כל עובדת במשרד
3. היא תקבל מייל עם קישור לקביעת סיסמה

---

## גישה למערכת

| מה | URL |
|---|---|
| **טופס לעובדים** | `https://ozhadar-recruitment.vercel.app` |
| **CRM למשרד** | `https://ozhadar-recruitment.vercel.app?crm` |

---

## .gitignore
```
node_modules/
dist/
.env
.env.local
```

---

## עדכונים עתידיים

כל שינוי שתדחוף ל-GitHub יתעדכן אוטומטית ב-Vercel תוך ~30 שניות.
