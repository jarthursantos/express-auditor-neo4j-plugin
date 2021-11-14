# express-auditor-neo4j-plugin
Neo4j plugin to [express-auditor](https://github.com/jarthursantos/express-auditor)

## Installation 

Install this package and [express-auditor](https://github.com/jarthursantos/express-auditor) in your [NodeJS](https://nodejs.org/) project

```bash
$ yarn add express-auditor express-auditor-neo4j-plugin
```
or

```bash
$ npm i express-auditor express-auditor-neo4j-plugin
```

## Getting Started

Follow this [Getting Started](https://github.com/jarthursantos/express-auditor#getting-started) to understand why [express-auditor](https://github.com/jarthursantos/express-auditor) works

```ts
import { createAuditor } from 'express-auditor'
import neo4jPlugin from 'express-auditor-neo4j-plugin'

// pass the plugin in express-auditor options

const { auditor, handler } = createAuditor({
  plugins: [neo4jPlugin]
})
```

### Auditing session

With a [neo4j-driver](https://github.com/neo4j/neo4j-javascript-driver) instance do:

```ts
import Neo4j from 'neo4j-driver'

const driver = Neo4j.driver(
  NEO4J_URL,
  Neo4j.auth.basic(USERNAME, PASSWORD)
)

app.get('/', async (request, response) => {
  const session = request.audit.neo4j.auditSession(
    driver.session()
  )

  // when {run} are called, a log with query, summary or error are logged in audit data
  const { result } = await session.run(QUERY)

  /* do something */
})
```

### Auditing transaction

With a [neo4j-driver](https://github.com/neo4j/neo4j-javascript-driver) instance do:

```ts
import Neo4j from 'neo4j-driver'

const driver = Neo4j.driver(
  NEO4J_URL,
  Neo4j.auth.basic(USERNAME, PASSWORD)
)

app.get('/', async (request, response) => {
  const session = driver.session();
  
  const transaction = request.audit.neo4j.auditSession(
    session.beginTransaction()
  )

  try {
    // when {run} are called, a log with query, summary or error are logged in audit data
    const { records } = await transaction.run(QUERY)
  
    // when {commit} are called, a log with empty metadata or error are logged in audit data
    await transaction.commit()
  } catch (error) {
    // when {rollback} are called, a log with empty metadata or error are logged in audit data
    await transaction.rollback()
  }
  /* do something */
})
```