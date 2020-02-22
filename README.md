[![codecov](https://codecov.io/gh/PragunSaini/vndb-api/branch/master/graph/badge.svg)](https://codecov.io/gh/PragunSaini/vndb-api) [![Build Status](https://travis-ci.org/PragunSaini/vndb-api.svg?branch=master)](https://travis-ci.org/PragunSaini/vndb-api) [![Documentation Status](https://readthedocs.org/projects/ansicolortags/badge/?version=latest)](https://pragunsaini.github.io/vndb-api/)

## VNDB API

This is a Node.js API for [VNDB (the Visual Novel Database)](https://vndb.org/).
VNDB provides it's own public API but it's not the best in terms of usability.
This library provides an easily usable and intuitive Promise based interface to connect to and query the VNDB API.

The **docs** are available [here](https://pragunsaini.github.io/vndb-api/).

### HIGHLIGHTS

- Allows configurable rate limiting.
- Uses connection pooling.
- Returns responses parsed into JSON

### INSTALLATION

    npm i vndb-api

### USAGE

```js
const VNDB = require('vndb-api')

// Create a client
const vndb = new VNDB('clientname', {
  // optionally, override any connection options you need to here, like
  minConnection: 1,
  maxConnection: 10,
})

// Send a query
vndb
  .query('dbstats')
  .then(response => {
    // Use the response
    console.log(response)
  })
  .catch(err => {
    // Handle errors
    console.log(err)
  })
  .finally(() => {
    // Destroy the client and any connections
    vndb.destroy()
  })
```

### API

#### ConnectionOptions

You can optionally provide the connection options. Defaults are reasonably set according to https://vndb.org/d11, but you can override them if you want. The connection options are:

```js
const vndb = new VNDB('clientname', {
  // The VNDB API hostname
  host: 'api.vndb.org',
  // The VNDB API port (use the TLS port)
  port: 19535,
  // You shouldn't need to change the host or the port unless VNDB changes them

  // The encoding to use
  encoding: 'utf-8',
  // The max number of queries allowed to send per queryInterval milliseconds
  queryLimit: 10,
  // The time limit in which at most queryLimit queries are allowed to send (in milliseconds)
  queryInterval: 30000,
  // The minimum number of connections to the API to keep in the pool
  minConnection: 1,
  // The maximum number of connections to the API allowed
  maxConnection: 10,
  // Unused/Free connections in the pool are destroyed after this many milliseconds
  idleTimeoutMillis: 30000,
  // If a connection is not established within this many milliseconds, an error with the corresponding reason is generated
  acquireTimeout: 30000,
  // If this is true, then the client errors out the first time unable to establish a connection and does not retry
  // If this is false, then the client will retry for acquireTimeout milliseconds to establish a connection
  propagateCreateError: false,
})
```

#### Methods

The following methods are available:

```js
// The constructor
// Requires a parameter clientname which represents your client
// Optionally you can provide a ConnectionOptions object
const vndb = new VNDB('clientname', {
  // any connection options here
})
```

```js
// query method
// Requires a VNDB API compatible qeury string
// Check out https://vndb.org/d11 for all types of queries
// Ex: 'dbstats' or 'get vn basic (id = 4)'
// Returns a Promise that resolves once the response is recieved or rejects on error
vndb
  .query('dbstats')
  .then(response => {
    // handle response
    // The format of responses varies according to the query
  })
  .catch(e => {
    // handle errors
  })
```

```js
// destroy method
// Closes all connections and destroyes the client
// Returns a Promise that resolves once the client is destroyed
vndb.destroy().then(() => {
  // Client destroyed
})
```

#### Responses

The response of a query is a JSON object, but the fields can vary according to the query.
The fields of any query are described here https://vndb.org/d11
Two fields are present on every response:

> In case of a `dbstats` query:

```js
status: 'dbstats'
searchType: 'dbstats'
```

> In case of a `get resource` query (for example `get vn ...`) :

```js
status: 'results'
searchType: 'resource' // 'vn' in example
```

#### Errors

The errors also vary according to the place they occur. But for all errors the error object has two fields:

```js
status: 'error'
code: 'varies according to error'
```

... along with more fields desribing the errors.

Mainly there are two types of errors:

- Those that occur while connecting, like CONTIMEOUT due to timeout or LOGINREJECT due to invalid client name, etc.

- Those that happen due to a query. These erros are described here https://vndb.org/d11.
