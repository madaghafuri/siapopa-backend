export function getValidKeyValuePairs<T extends Record<string, string | File>>(
  obj: T
) {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([key, value]) => value !== null && value !== undefined && value !== ''
    )
  );
}
