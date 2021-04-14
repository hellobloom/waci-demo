import { Entity, Column, PrimaryGeneratedColumn, Repository, CreateDateColumn, UpdateDateColumn } from 'typeorm'

import { databaseManager } from '@server/database'
import { hashToken } from '@server/util'

@Entity({ name: 'used_tokens' })
export class UsedTokens {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'token_sha', type: 'text', unique: true })
  tokenSha!: string

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date

  @CreateDateColumn({name: 'created_at'})
  createdAt!: Date

  @UpdateDateColumn({name: 'updated_at'})
  updatedAt!: Date

  static getRepo = (): Repository<UsedTokens> => databaseManager.getRepository(UsedTokens)
}

// Expires token, marking it as having been used/consumed.
export const useToken = async (token: string, expiresAt: Date) => {
  const usedToken = new UsedTokens()
  usedToken.tokenSha = hashToken(token)
  usedToken.expiresAt = expiresAt

  await UsedTokens.getRepo().save(usedToken)
}

export const isTokenUsed = async (token: string) =>
  typeof (await UsedTokens.getRepo().findOne({ where: { tokenSha: hashToken(token) } })) !== 'undefined'
