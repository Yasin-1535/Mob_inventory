/**
 * Safely escapes special regular expression characters from user search queries.
 * Prevents Regex Injection (ReDoS) and MongoDB syntax errors when users search
 * for terms containing characters like '(', ')', '[', ']', '+', '*', '?', etc.
 */
export function escapeRegex(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Creates a safe case-insensitive MongoDB regex search object.
 */
export function safeRegex(text: string) {
  return { $regex: escapeRegex(text), $options: 'i' };
}
