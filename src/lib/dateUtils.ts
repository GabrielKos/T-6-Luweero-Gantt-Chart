/**
 * Utility functions for East Africa Time (EAT: UTC+3) World Clock synchronization.
 */

// Get current date string in East Africa Time (Africa/Nairobi: UTC+3) formatted as YYYY-MM-DD
export function getEATDateString(date: Date = new Date()): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

// Format date for display in EAT timezone (e.g., "Aug 13, 2026")
export function formatEATDate(dateString: string): string {
  const simMs = new Date(`${dateString}T12:00:00`).getTime();
  return new Date(simMs).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
