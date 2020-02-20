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

/**
 * Just a helper function to wait for a certain amount of time
 * @param duration Amount of time to wait for (in milliseconds)
 */
function wait(duration: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}

/**
 * Represents a Response object
 */
interface VNDBResponse {
  status?: string
  searchType?: string
  // eslint-disable-next-line
  [key: string]: any
}

interface VNDBError extends VNDBResponse {
  id?: string
  msg?: string
  fullwait?: number
  field?: string
}

/**
 * Converts the raw response to JSON and adds the status and search type to response object
 * @param query The query string
 * @param response THe raw response from VNDB
 * @return Response in JSON form
 */
function parseResponse(query: string, response: string): object {
  const status: string = (response.match(/(\S+) {/) as RegExpMatchArray)[1]
  const rawBody: string = (response.match(/{.+}/) as RegExpMatchArray)[0]
  const body: VNDBResponse = JSON.parse(rawBody)
  body.status = status
  const searchType: string = query.substring(4, query.indexOf(' ', 4))
  body.searchType = searchType
  return body
}

export { filterObject, wait, parseResponse, VNDBResponse, VNDBError }
