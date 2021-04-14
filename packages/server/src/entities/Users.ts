import { UserView } from '@waci-demo/shared'
import { Entity, Column, PrimaryGeneratedColumn, Repository, CreateDateColumn, UpdateDateColumn } from 'typeorm'

import { databaseManager } from '../database'

@Entity({ name: 'users' })
export class Users {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'citext', unique: true })
  username!: string

  @CreateDateColumn({name: 'created_at'})
  createdAt!: Date

  @UpdateDateColumn({name: 'updated_at'})
  updatedAt!: Date

  toView = (): UserView => ({
    id: this.id,
    username: this.username,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  })

  static getRepo = (): Repository<Users> => databaseManager.getRepository(Users)
}
