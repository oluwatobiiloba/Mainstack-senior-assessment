// Helper functions to assist with configuring crons via environment variables. Courtesy of HeyI 🤖
export function everySeconds(seconds: number): string {
  if (seconds < 1 || seconds > 59) {
    throw new Error('Seconds must be between 1 and 59');
  }
  return `*/${seconds} * * * * *`;
}

export function everyMinutes(minutes: number): string {
  if (minutes < 1 || minutes > 59) {
    throw new Error('Minutes must be between 1 and 59');
  }
  return `0 */${minutes} * * * *`;
}

export function everyHours(hours: number): string {
  if (hours < 1 || hours > 23) {
    throw new Error('Hours must be between 1 and 23');
  }
  return `0 0 */${hours} * * *`;
}