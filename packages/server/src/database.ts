import { Connection, createConnection, ObjectType, EntitySchema, Repository } from 'typeorm'

const ormconfig = require('../ormconfig.js')

export class DatabaseManager {
  connection?: Connection

  getRepository = <T>(target: ObjectType<T> | EntitySchema<T> | string): Repository<T> => {
    if (this.connection) {
      return this.connection.getRepository(target)
    } else {
      throw new Error('Must call `createDatabaseConnection` before connecting to a repository')
    }
  }

  createDatabaseConnection = async (logger: (message: any) => void): Promise<void> => {
    logger('Trying to create db connection')

    try {
      // Do not include migrations when starting the service.
      // It tries to evaluate/import the TS files, and that breaks.
      const newConnection = await createConnection({ ...ormconfig, migrations: undefined, migrationsRun: false })
      logger('Made a DB connection')
      this.connection = newConnection
    } catch (error) {
      logger('Encountered an error')
      logger(error)
      throw error
    }
  }
}

export const databaseManager = new DatabaseManager()
