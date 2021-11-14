import { Request, Response } from 'express'
import { ExternalPlugin } from 'express-auditor'
import { v4 as uuid } from 'uuid'

import { Session, Transaction } from 'neo4j-driver'

import injectSession from './utils/session'
import injectTransaction from './utils/transaction'
import { SuccessRun, ErrorRun } from './utils/types'

export interface Neo4jPlugin {
  auditSession(session: Session): Session 
  auditTransaction(transaction: Transaction): Transaction 
}

export interface Neo4jStore {
  runs: RunData[]
}

export type RunData = SuccessSessionRunData
  | ErrorSessionRunData
  | SuccessTransactionRunData
  | ErrorTransactionRunData
  | SuccessTransactionCommitData
  | ErrorTransactionCommitData
  | SuccessTransactionRollbackData
  | ErrorTransactionRollbackData

interface BaseRunData {
  runAt: Date
}

interface SessionRunData extends BaseRunData {
  sessionID: string
}

interface TransactionRunData extends BaseRunData {
  transactionID: string
}

export interface SuccessSessionRunData extends SessionRunData {
  type: 'RUN_SUCCESS'
  summary: SuccessRun
}

export interface ErrorSessionRunData extends SessionRunData {
  type: 'RUN_ERROR'
  error: ErrorRun
}

export interface SuccessTransactionRunData extends TransactionRunData {
  type: 'RUN_SUCCESS'
  summary: SuccessRun
}

export interface ErrorTransactionRunData extends TransactionRunData {
  type: 'RUN_ERROR'
  error: ErrorRun
}

export interface SuccessTransactionCommitData extends TransactionRunData {
  type: 'COMMIT_SUCCESS'
}

export interface ErrorTransactionCommitData extends TransactionRunData {
  type: 'COMMIT_ERROR'
  error: {
    name: string
    code: string
    message: string
  }
}

export interface SuccessTransactionRollbackData extends TransactionRunData {
  type: 'ROLLBACK_SUCCESS'
}

export interface ErrorTransactionRollbackData extends TransactionRunData {
  type: 'ROLLBACK_ERROR'
  error: {
    name: string
    code: string
    message: string
  }
}

const plugin: ExternalPlugin<Neo4jPlugin, Neo4jStore> = {
  name: 'neo4j',

  create(request: Request, response: Response) {
    const store: Neo4jStore = {
      runs: []
    }
    
    return {
      store,

      plugin: {
        auditSession(session) {
          const sessionID = uuid()

          return injectSession(
            session,
            summary => store.runs.push(
              { sessionID, runAt: new Date(), type: 'RUN_SUCCESS', summary }
            ),
            error => store.runs.push(
              { sessionID, runAt: new Date(), type: 'RUN_ERROR', error }
            ),
          )
        },

        auditTransaction(transaction) {
          const transactionID = uuid();

          return injectTransaction(
            transaction,
            summary  => store.runs.push(
              { transactionID, runAt: new Date(), type: 'RUN_SUCCESS', summary }
            ),
            error  => store.runs.push(
              { transactionID, runAt: new Date(), type: 'RUN_ERROR', error }
            ),
            commitError => {
              const runAt = new Date()

              if (commitError) {
                const { name, code, message } = commitError;
                store.runs.push(
                  { transactionID, runAt, type: 'COMMIT_ERROR', error: { name, code, message } }
                )
              } else {
                store.runs.push(
                  { transactionID, runAt, type: 'COMMIT_SUCCESS' }
                )
              }
            },
            rollbackError => {
              const runAt = new Date()

              if (rollbackError) {
                const { name, code, message } = rollbackError;
                store.runs.push(
                  { transactionID, runAt, type: 'ROLLBACK_ERROR', error: { name, code, message } }
                )
              } else {
                store.runs.push(
                  { transactionID, runAt, type: 'ROLLBACK_SUCCESS' }
                )
              }
            } 
          )
        }
      },

      finish() {}
    }
  }
}

export default plugin
export * from './utils/types'

declare module 'express-auditor' {
  export interface AuditSession {
    neo4j: Neo4jPlugin
  }
  
  export interface AuditStore {
    neo4j: Neo4jStore
  }
}
