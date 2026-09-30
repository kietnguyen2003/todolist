import {test as base, expect, type Page} from '@playwright/test';
import {createSampleData} from '../__tests__/fixtures/sampleData';

// Seed only tests that exercise example data. Dates follow each browser's clock,
// including tests that freeze time before navigating, and reloads retain edits.
export const test = base.extend({
  page: async ({page}, use) => {
    const seed = ({state, key}:{state:ReturnType<typeof createSampleData>;key:string}) => {
      if (localStorage.getItem(key) !== null) return;
      const reference = Date.UTC(2026, 8, 29);
      const today = new Date();
      function shift(date: string) {
        const offset = (Date.parse(`${date}T00:00:00Z`) - reference) / 86400000;
        const result = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
        return `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2,'0')}-${String(result.getDate()).padStart(2,'0')}`;
      }
      localStorage.setItem(key, JSON.stringify({version:1, state:{
        tasks:state.tasks.map(task => ({...task, date:shift(task.date)})),
        habits:state.habits.map(habit => ({...habit, startDate:shift(habit.startDate)})),
        counts:Object.fromEntries(Object.entries(state.counts).map(([date,counts]) => [shift(date),counts])),
      }}));
    };
    // Normal document scripts run after Playwright installs its clock. Init-script
    // ordering is undefined and could otherwise seed dates from the real clock.
    await page.route('http://127.0.0.1:8081/', async route => {
      const response = await route.fetch();
      const html = await response.text();
      const args = JSON.stringify({state:createSampleData('2026-09-29'), key:'tung-buoc:today:v1'});
      await route.fulfill({response,body:html.replace('<head>', `<head><script>(${seed.toString()})(${args});</script>`)});
    });
    await use(page);
  },
});
export {expect, type Page};
