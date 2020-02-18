/**
 * Return a similar object but with all null or undefined properties removed
 * @param obj The object to be filtered
 */
function filterObject(obj: object | undefined): object {
  if (obj == undefined) {
    return {}
  }
  return Object.entries(obj).reduce((acc, [k, v]) => (v == null ? acc : { ...acc, [k]: v }), {})
}

export { filterObject }
