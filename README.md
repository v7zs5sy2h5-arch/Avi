# Keren Amar | ניהול תורים ותזרים

מערכת ניהול תורים, לקוחות והכנסות לעסק קוסמטיקה עצמאי — Next.js (App
Router) + TypeScript + Tailwind CSS + Supabase.

## תצוגה מקדימה מקומית (בלי Supabase אמיתי)

לצורך בדיקה מהירה של המסכים והזרימות לפני הקמת Supabase, יש מצב תצוגה
מקדימה שרץ מול נתונים בזיכרון בלבד (client/treatments/appointments/
תשלומים/הוצאות לדוגמה) — בלי צורך בפרויקט Supabase או משתני סביבה
אמיתיים:

```bash
npm install
LOCAL_MODE=true npm run dev
```

(או: להוסיף `LOCAL_MODE=true` לקובץ `.env.local` ואז פשוט `npm run dev`)

פותחים [http://localhost:3000](http://localhost:3000) — מסך ההתחברות
מקבל **כל אימייל/סיסמה** (למשל `demo@test.com` / `123456`). כל הפעולות
עובדות באמת (יצירת תור, סימון כהושלם, חסימת תורים חופפים וכו'), אבל
הנתונים **לא נשמרים לצמיתות** — הם מתאפסים בכל הפעלה מחדש של שרת
הפיתוח. ברגע שהתצוגה המקדימה מאושרת, יש להסיר את `LOCAL_MODE` (או
להגדיר `LOCAL_MODE=false`) ולהמשיך להקמת Supabase האמיתי למטה.

## הקמת Supabase

1. **יצירת פרויקט** — בכתובת [supabase.com](https://supabase.com) יוצרים
   פרויקט חדש (הטיר החינמי מספיק).
2. **הרצת המיגרציה** — בלשונית SQL Editor בפרויקט, מריצים את התוכן של
   `supabase/migrations/0001_init.sql` (יוצר את כל הטבלאות, ה-RLS,
   וחסימת התנגשויות תורים).
3. **יצירת המשתמשת** — בלשונית Authentication → Users, יוצרים משתמשת אחת
   (אימייל + סיסמה) — זו קרן, המשתמשת היחידה של המערכת.
4. **זריעת מחירון ברירת המחדל** — פותחים את
   `supabase/migrations/0002_seed_treatments.sql`, מחליפים את
   `REPLACE_WITH_LOGIN_EMAIL` באימייל שנוצר בשלב הקודם, ומריצים את הקובץ
   כולו ב-SQL Editor. זה מזין את מחירון הטיפולים ההתחלתי ואת קטגוריות
   ההוצאה.
5. **משתני סביבה** — יוצרים קובץ `.env.local` (יש `.env.local.example`
   לדוגמה) עם:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

   שני הערכים נמצאים בהגדרות הפרויקט ב-Supabase תחת Project Settings →
   API.

## הרצה מקומית

```bash
npm install
npm run dev
```

האפליקציה עולה על [http://localhost:3000](http://localhost:3000).
בכניסה ראשונה יש להתחבר עם האימייל/סיסמה שנוצרו בשלב 3 למעלה.

## פריסה (Deploy)

הפרויקט מוכן לפריסה בכל שירות שתומך ב-Next.js (למשל Vercel) — מגדירים
את אותם משתני הסביבה (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`) בהגדרות הפרויקט בשירות הפריסה.

## הלוגו

הלוגו הרשמי חולץ מקובץ ה-PDF שסופק וגזור לשלושה קבצים ב-`public/`:

- `public/logo-full.png` — הלוגו המלא (מונוגרמה + "KEREN AMAR" + התגית),
  מוצג במסך ההתחברות.
- `public/logo-mark.png` — המונוגרמה "ka" בלבד, מוצגת בהדר של כל המסכים.
- `public/favicon.png` — גרסה ריבועית עם רקע בז' של המערכת, לטאב הדפדפן
  ולאייקון PWA.

אם בעתיד יתקבל קובץ וקטורי (SVG/AI) מקורי מהמעצבת, אפשר להחליף את
שלושת הקבצים באיכות וקטורית מלאה — יש רק לעדכן את הסיומת בהפניות
ב-`src/app/layout.tsx`, `src/app/login/page.tsx`,
`src/components/layout/Header.tsx`, `src/app/(app)/page.tsx`
ו-`public/manifest.json` אם משנים סיומת קובץ.

## מבנה הנתונים

כל הטבלאות מוגנות ב-Row Level Security כך שכל שורה משויכת ל-`user_id`
ורק המשתמשת המחוברת יכולה לראות/לערוך אותה. עקרון מרכזי במערכת: **אין
הזנת הכנסה ידנית** — רשומת הכנסה (`treatment_log`) נוצרת אך ורק דרך
סימון תור כ"הושלם". חסימת התנגשויות תורים חופפים נאכפת ברמת בסיס
הנתונים (constraint מסוג `EXCLUDE`), כך שגם בקשות מקבילות לא יכולות
ליצור תורים חופפים.

## טכנולוגיה

- Next.js 16 (App Router, Server Actions) + TypeScript + Tailwind CSS v4
- Supabase (Postgres + Auth + RLS)
- recharts לגרפים, lucide-react לאייקונים, date-fns לתאריכים
- עברית מלאה, RTL, Mobile-First
