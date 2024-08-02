export function getValidKeyValuePairs<T extends Record<string, string | File>>(
  obj: T
) {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([key, value]) => value !== null && value !== undefined && value !== ''
    )
  );
}

export function containsObject<T extends Object, K extends Array<T>>(
  obj: T,
  list: K
) {
  const found = list.find(
    (value) => JSON.stringify(value) === JSON.stringify(obj)
  );

  return !!found;
}
