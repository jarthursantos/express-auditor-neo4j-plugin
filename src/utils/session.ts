import { Session, Neo4jError } from "neo4j-driver";
import { SuccessRun, ErrorRun, Counts } from './types'

export default function(
  session: any,
  onSuccess: (summary: SuccessRun) => void,
  onError: (error: ErrorRun) => void
): Session {
  const oldRun = session.run;

  session.run = async (...args: any[]) => {
    try {
      const response = await oldRun.call(session, ...args);
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

  return session as Session
}