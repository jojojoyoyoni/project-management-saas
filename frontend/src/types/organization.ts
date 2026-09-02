export interface Organization {
  id: string
  name: string
  slug: string
  description: string
  logo: string | null
  plan: 'free' | 'pro' | 'enterprise'
  max_members: number
  max_projects: number
  owner: string
  member_count: number
  project_count: number
  is_owner: boolean
  current_user_role: 'owner' | 'admin' | 'member' | 'guest' | null
  created_at: string
}
