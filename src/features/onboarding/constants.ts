export const INTENTS = [
  ['know', '🔍', 'Know each other more deeply'],
  ['talk', '💬', 'Spark better conversations'],
  ['rough', '🌧️', 'Navigate the hard moments'],
  ['far', '✈️', 'Stay close, long-distance'],
  ['fun', '🎈', 'Just have more fun together'],
] as const;

// [id, emoji, label, display time (12h), DB time (24h HH:MM for the `time` column)]
export const MOMENTS = [
  ['morning', '☕', 'Morning coffee', '8:00 AM', '08:00'],
  ['lunch', '🥪', 'Lunch break', '12:30 PM', '12:30'],
  ['evening', '🌙', 'Evening wind-down', '8:00 PM', '20:00'],
  ['bed', '😴', 'Before bed', '10:30 PM', '22:30'],
] as const;
