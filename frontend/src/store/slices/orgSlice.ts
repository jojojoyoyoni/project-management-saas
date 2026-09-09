import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Organization } from '@/types/organization'

interface OrgState {
  activeOrganizationId: string | null
  organizations: Organization[]
}

const initialState: OrgState = {
  activeOrganizationId: localStorage.getItem('activeOrgId'),
  organizations: [],
}

const orgSlice = createSlice({
  name: 'org',
  initialState,
  reducers: {
    setOrganizations: (state, action: PayloadAction<Organization[]>) => {
      state.organizations = action.payload
    },
    
    // FIX: Change payload type to string
    setActiveOrganization: (state, action: PayloadAction<string>) => {
      state.activeOrganizationId = action.payload
      localStorage.setItem('activeOrgId', action.payload)
    },
    
    clearActiveOrganization: (state) => {
      state.activeOrganizationId = null
      localStorage.removeItem('activeOrgId')
    }
  },
})

export const { setOrganizations, setActiveOrganization, clearActiveOrganization } = orgSlice.actions
export default orgSlice.reducer