export function parseUTCDate(dateString: string | Date | undefined | null): Date {
  if (!dateString) return new Date();
  if (dateString instanceof Date) return dateString;
  
  // もしタイムゾーン情報が含まれていない形式 (Zや+09:00がない) であれば UTC ('Z') を付与する
  // 例: "2026-09-23T00:50:34.123" -> "2026-09-23T00:50:34.123Z"
  if (typeof dateString === 'string' && !dateString.endsWith('Z') && !dateString.match(/[+-]\d{2}:\d{2}$/)) {
    return new Date(dateString + 'Z');
  }
  return new Date(dateString);
}
