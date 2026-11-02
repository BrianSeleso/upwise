# UpWise
Plan with purpose. Progress with intention.

## Setup
1. `npm install`
2. Create a Firebase project; enable Authentication (Google, Email/Password) and Firestore.
3. `cp .env.example .env` and fill in your web app config.
4. `npm run dev`
5. Deploy rules: `firebase deploy --only firestore:rules`; test with `npm run emulators`.
6. Ship: `npm run build && firebase deploy --only hosting`

## Status
Built: auth, security rules, offline cache + sync badge, tasks, goals with milestones, Monday-Sunday planner (board + time grid),
recoverable timestamp timer, manual log service, insights with PDF export, custom categories.
Next: daily/weekly review pages, manual time-entry UI, browser reminders, recurring tasks, rules tests in the emulator.
