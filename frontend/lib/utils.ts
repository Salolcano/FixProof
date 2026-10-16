export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function shortAddress(address: string | null | undefined): string {
  if (!address) return "";
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}

export function formatDuration(seconds: number): string {
  if (seconds >= 86400) return `${Math.round(seconds / 8640) / 10} days`;
  if (seconds >= 3600) return `${Math.round(seconds / 360) / 10} hours`;
  if (seconds >= 60) return `${Math.round(seconds / 60)} minutes`;
  return `${seconds} seconds`;
}
