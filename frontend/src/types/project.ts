export interface Project {
  id: string
  name: string
  description: string
  owner: string
  created_at: string
  updated_at: string
}

// Standard DRF Paginated Response
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
