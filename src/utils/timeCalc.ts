export function formatMinutes(totalMinutes: number): string {
  if (!totalMinutes || isNaN(totalMinutes)) return '0 ч 00 мин';
  const hours = Math.floor(Math.abs(totalMinutes) / 60);
  const minutes = Math.floor(Math.abs(totalMinutes) % 60);
  const padMin = minutes.toString().padStart(2, '0');
  
  if (totalMinutes < 0) {
    return `-${hours > 0 ? `${hours} ч ` : ''}${padMin} мин`;
  }
  
  return `${hours} ч ${padMin} мин`;
}
