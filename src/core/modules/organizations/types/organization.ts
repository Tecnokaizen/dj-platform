export type Organization = {
  id: string
  name: string
  slug: string
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED'
  logoUrl: string | null
  locale: string
  timezone: string
  createdAt: Date
  updatedAt: Date
  archivedAt: Date | null
}
