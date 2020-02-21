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
 * Represents a general Response object, can have varying types of properties depending on the request, @see {@link https://vndb.org/d11}
 */
interface VNDBResponse {
  status?: string
  searchType?: string
  // eslint-disable-next-line
  [key: string]: any
}

/**
 * Represents an Error Response object
 */
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
function parseResponse(query: string, response: string): VNDBResponse {
  const status: string = (response.match(/(\S+) {/) as RegExpMatchArray)[1]
  const rawBody: string = (response.match(/{.+}/) as RegExpMatchArray)[0]
  const body: VNDBResponse = JSON.parse(rawBody)
  body.status = status
  if (status == 'error') {
    body.searchType = query
    body.code = (body as VNDBError).id?.toUpperCase()
  } else if (status == 'dbstats') {
    body.searchType = 'dbstats'
  } else {
    // using 4 because currently only get requests are supported
    const searchType: string = query.substring(4, query.indexOf(' ', 4))
    body.searchType = searchType
  }

  return body
}

/**
 * Utility to convert API errors to valid JSON format, only used for connection/login errors, query errors are handled by [[parseResponse]]
 * @param error The raw error response
 * @return Error object
 */
function errorParser(error: string): VNDBError {
  const status: string = (error.match(/(\S+) {/) as RegExpMatchArray)[1]
  const rawBody: string = (error.match(/{.+}/) as RegExpMatchArray)[0]
  const body: VNDBError = JSON.parse(rawBody)
  body.status = status
  return body
}

export { filterObject, wait, parseResponse, errorParser, VNDBResponse, VNDBError }
