// Registry of every page / mini-app in Stardesk. The Apps launcher, search and
// routing all read from this list. To ship a new app in a later step:
//   1. set ready: true here,
//   2. add its component to VIEWS in App.jsx.

export const GROUPS = [
  ['core', 'Stardesk basics', '✦'],
  ['daily', 'Daily life', '🏠'],
  ['health', 'Health & wellness', '🍀'],
  ['work', 'Work & career', '💼'],
  ['growth', 'Personal growth & fun', '🌱'],
  ['utility', 'Utilities', '🧰'],
]

// [id, label, emoji, group, description, step it ships in, ready]
const RAW = [
  ['planner', 'Planner', '🗓️', 'core', 'Day, week and month views with reminders.', 0, true],
  ['tasks', 'Tasks', '✅', 'core', 'To-dos with priorities and due dates.', 0, true],
  ['habits', 'Habits', '⭐', 'core', 'Daily habits with streaks.', 0, true],
  ['study', 'Study', '⏱️', 'core', 'Focus timer and study log.', 0, true],
  ['classes', 'Classes', '🎓', 'core', 'Timetable for two semesters.', 0, true],
  ['dates', 'Key dates', '📝', 'core', 'Exams, deadlines and countdowns.', 0, true],
  ['notes', 'Notes', '📒', 'core', 'Notes on four paper styles.', 0, true],

  ['clock', 'World clock', '🌍', 'utility', 'Time in your friends’ and clients’ cities.', 2, true],
  ['prayer', 'Prayer times & Hijri', '🕌', 'utility', 'Prayer times for your location, works offline.', 2, true],
  ['weather', 'Weather', '⛅', 'utility', 'Live weather for your city.', 2, true],
  ['countdowns', 'Countdowns', '⏳', 'utility', 'Eid, trips and more – days to go.', 2, true],

  ['meals', 'Meal planner', '🍲', 'daily', 'Weekly menu and grocery list.', 3, true],
  ['lists', 'Shopping & packing', '🛒', 'daily', 'Reusable lists for groceries and travel.', 3, true],
  ['chores', 'Home chores', '🧹', 'daily', 'Rotating chores shared with family.', 3, true],
  ['budget', 'Budget & expenses', '💰', 'daily', 'Income, spending, charts and warnings.', 4, true],
  ['bills', 'Bills & subscriptions', '🧾', 'daily', 'Due-date alerts and monthly total.', 4, true],
  ['birthdays', 'Birthdays & anniversaries', '🎂', 'daily', 'Yearly reminders and gift ideas.', 4, true],
  ['travel', 'Travel planner', '✈️', 'daily', 'Dates, itinerary, budget and bookings.', 4, true],

  ['water', 'Water & sleep', '💧', 'health', 'Glasses, sleep times and a weekly chart.', 5, true],
  ['workout', 'Workout log', '🏋️', 'health', 'Exercises, sets, reps and progress.', 5, true],
  ['medicine', 'Medicine reminder', '💊', 'health', 'Dose times with alerts.', 5, true],
  ['cycle', 'Cycle tracker', '🌸', 'health', 'Private, stays in this browser.', 5, true],
  ['breathe', 'Breathing timer', '🫧', 'health', 'Guided pixel breathing.', 6, true],
  ['mood', 'Mood journal', '🙂', 'health', 'One line a day and a monthly heatmap.', 6, true],

  ['jobs', 'Job applications', '📮', 'work', 'Company, status and follow-up date.', 7, true],
  ['freelance', 'Freelance & invoices', '🧑‍💻', 'work', 'Clients, deadlines, payments, time tracker.', 7, true],
  ['meetings', 'Meeting notes', '📋', 'work', 'Agendas and notes from templates.', 8, true],
  ['eisenhower', 'Eisenhower matrix', '🧭', 'work', 'Urgent vs important in four boxes.', 8, true],
  ['priorities', 'Weekly priorities', '🎯', 'work', 'Top 3 for the week, Friday review.', 8, true],
  ['routines', 'Routines & habit stacking', '🔗', 'work', 'Morning / night checklists in one click.', 8, true],

  ['goals', 'Goals & vision board', '🏔️', 'growth', 'Yearly goals, milestones, image board.', 9, true],
  ['gratitude', 'Gratitude journal', '🙏', 'growth', 'Three good things a day.', 9, true],
  ['reading', 'Reading list', '📚', 'growth', 'To read / reading / done, with progress.', 9, true],
  ['watchlist', 'Movies & shows', '🎬', 'growth', 'Watchlist with ratings.', 9, true],
  ['bucket', 'Bucket list', '🪣', 'growth', 'Tick it off and enjoy the confetti.', 9, true],
  ['quotes', 'Quote & challenge', '💌', 'growth', 'Daily affirmation and a small challenge.', 10, true],
  ['capsule', 'Time capsule', '⏳', 'growth', 'A message that opens in 6 months.', 10, true],
  ['zoo', 'Pixel Zoo', '🐸', 'growth', 'Draw a fish, frog, monkey, butterfly… and watch it come alive.', 12, true],
]

export const APPS = RAW.map(([id, label, emoji, group, desc, step, ready]) => ({ id, label, emoji, group, desc, step, ready }))
export const appById = (id) => APPS.find((a) => a.id === id)
export const readyApps = () => APPS.filter((a) => a.ready)