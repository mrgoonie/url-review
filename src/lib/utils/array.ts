export function sortToFirst(arr: any[], key: string, startWith: string) {
  return arr.sort((a, b) => {
    const aIsGoogle = a[key].startsWith(startWith);
    const bIsGoogle = b[key].startsWith(startWith);
    if (aIsGoogle && !bIsGoogle) {
      return -1; // a comes first
    }
    if (!aIsGoogle && bIsGoogle) {
      return 1; // b comes first
    }
    return 0; // no change in order
  });
}

export function unionArrays(duplicatedKey: string, ...arrays: any[][]) {
  const cache: { [key: string]: boolean } = {};
  const result: any[] = [];
  for (const item of [...arrays]) {
    if (!cache[item[duplicatedKey]]) {
      cache[item[duplicatedKey]] = true;
      result.push(item);
    }
  }
  return result;
}
