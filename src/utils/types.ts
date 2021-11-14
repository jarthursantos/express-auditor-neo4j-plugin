export interface QueryData {
  text: string
  parameters: {
    [key: string]: any;
  }
  type?: string
}

export interface Counts {
  nodesCreated: number
  nodesDeleted: number
  relationshipsCreated: number
  relationshipsDeleted: number
  propertiesSet: number
  labelsAdded: number
  labelsRemoved: number
  indexesAdded: number
  indexesRemoved: number
  constraintsAdded: number
  constraintsRemoved: number
}

export interface SuccessRun {
  query: QueryData
  counters: Counts
}

export interface ErrorRun {
  query: QueryData
  name: string
  code: string
  message: string
}

export interface CommitTransaction {
  committedAt: Date
}

export interface RollbackTransaction {
  rollbackAt: Date
}