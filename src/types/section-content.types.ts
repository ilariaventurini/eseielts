import type { Timestamp } from 'firebase/firestore'

import type { IeltsSkill } from '@/constants/routes.constants'

export type SectionContentSkill = Exclude<IeltsSkill, 'writing'>

export interface SectionContentItem {
  readonly id: string
  readonly title: string
  readonly body: string
  readonly createdAt: Timestamp | null
}
