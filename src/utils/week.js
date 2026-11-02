import { startOfWeek, addDays, format } from 'date-fns'
export const weekStart = (d = new Date()) => startOfWeek(d, { weekStartsOn: 1 }) // Monday to Sunday
export const weekId = (d) => format(weekStart(d), 'yyyy-MM-dd')
export const weekDays = (d) => Array.from({ length: 7 }, (_, i) => addDays(weekStart(d), i))
export const iso = (d) => format(d, 'yyyy-MM-dd')
