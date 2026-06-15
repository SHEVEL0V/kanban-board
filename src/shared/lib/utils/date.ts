// Converts a Date to the "YYYY-MM-DD" format expected by <input type="date">,
// using local date parts so the displayed day doesn't shift across timezones.
export function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
