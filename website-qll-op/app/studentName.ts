export const maxStudentNameLength = 120;

export function parseStudentName(value: unknown) {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/gu, " ");
  return name.length <= maxStudentNameLength && /\p{L}/u.test(name) && !/\p{Cc}/u.test(name) ? name : null;
}
