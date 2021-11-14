import { Transaction, Neo4jError } from "neo4j-driver";
import { SuccessRun, ErrorRun, Counts } from './types'

export default function(
  transaction: any,
  onSuccess: (summary: SuccessRun) => void,
  onError: (error: ErrorRun) => void,
  onCommit: (error?: Neo4jError) => void,
  onRollback: (error?: Neo4jError) => void
): Transaction {
  const oldRun = transaction.run;
  const oldCommit = transaction.commit;
  const oldRollback = transaction.rollback;

  transaction.run = async (...args: any[]) => {
    try {
      const response = await oldRun.call(transaction, ...args);
      const { summary } = response;
  
      const { query: { text, parameters }, queryType, counters } = summary

      onSuccess(
        {
          query: { type: queryType, text, parameters },
          counters: (counters as any)._stats as Counts
        }
      );
  
      return response;
    } catch (error) {
      if (error instanceof Neo4jError) {
        onError(
          {
            query: {
              text: args[0],
              parameters: args[1]
            },
            name: error.name,
            code: error.code,
            message: error.message
          }
        )
      }

      throw error
    }
  };

  transaction.rollback = async () => {
    try {
      await oldRollback.call(transaction)

      onRollback()
    } catch (error) {
      if (error instanceof Neo4jError) {
        onRollback(error)
      }
      
      throw error
    }
  }

  transaction.commit = async () => {
    try {
      await oldCommit.call(transaction)

      onCommit()
    } catch (error) {
      if (error instanceof Neo4jError) {
        onCommit(error)
      }
      
      throw error
    }
  }

  return transaction as Transaction
}