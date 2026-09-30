# Tea Pret

Tea Pret is a local-first to-do and daily habits app built with Expo, React Native, and React Native Web. It uses Plus Jakarta Sans and a shared cream, navy, and rose theme.

## Run locally

Requires Node.js 22.13 or newer and npm.

```sh
npm install
npm run web
```

Open the URL printed by Expo to use the web app. For iOS or Android, run `npm run ios` or `npm run android` with the corresponding simulator installed, or open the project in a compatible Expo Go app.

## App behavior

The app opens directly to **To do** without an account. Its two navigation destinations are **To do** and **Calendar**. On small screens, navigation sits at the bottom; on wide web screens, it sits at the top.

To do contains both tasks and daily habits. Tasks can be marked complete and filtered by the selected day. A task may repeat weekly on the same weekday or monthly on the same day number; each occurrence has its own completion state. Months without that day number skip the monthly occurrence. The task form offers four colors from the shared app palette; tap an existing calendar event to change its color later, including every occurrence of a repeating task. Habits have a daily target, unit, progress, and streak. Use the progress amount or +/- buttons to update progress. The menu on each habit lets you edit its name, target, or unit, or permanently delete it and its recorded progress. Target choices use wheels; the `hours and minute` unit uses separate hour and minute wheels. Count units change with the target, such as `1 step` and `2 steps`; the `Time` unit counts occurrences (`1 time`, `2 times`). The date strip moves one week per swipe.

Calendar displays tasks only. Tap a free hour to create a task at that time. Tasks with explicit start and end times use those hours. A task created without a set time appears from its creation time (or the tapped calendar slot) through the end of its selected day. Older untimed tasks without a recorded start appear from midnight. Habits do not appear on Calendar. Overlapping task events are laid out side by side.

Tasks, habits, and progress are saved locally with AsyncStorage; React Native Web uses browser localStorage. Reloading preserves them. There is no backend, account sync, or backup. Clearing app or site data removes them. A Home Screen installation on iPhone can have separate storage from the same URL opened in Safari.

## Web deployment and iPhone Home Screen

`npm run build:web` exports static files to `dist/`. `vercel.json` configures Vercel to build and serve that directory. Once the project is connected to Vercel, deploy with `vercel` for a preview or `vercel --prod` for production. In iPhone Safari, open the stable production URL and use **Share → Add to Home Screen**. The app has a web manifest and Apple touch icon. It still needs a network connection to load initially; no offline service worker is configured.

## Checks

```sh
npm run typecheck
npm run test:coverage
npm run build:web
npx playwright test
```

The Playwright tests use a local server on port 8081. Sample data exists only in test fixtures; a fresh app starts empty.

## Key files

- `App.tsx`: app entry, fonts, navigation, and persisted state.
- `src/today/model.ts`: task and habit types, reducer, selectors, and validation.
- `src/today/TodayScreen.tsx`: To do page.
- `src/today/HabitForm.tsx` and `src/today/HabitRow.tsx`: habit creation, editing, and daily progress.
- `src/calendar/TaskForm.tsx`: shared task form.
- `src/calendar/taskEvents.ts`: task-to-calendar projection.
- `src/calendar/CalendarScreen.tsx`: Calendar page.
- `src/storage/`: local persistence and stored-data validation.
- `src/theme.ts`: colors and fonts shared by the app.
