import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface OrgState {
  activeOrganizationId: string | null
}

const initialState: OrgState = {
  activeOrganizationId: localStorage.getItem('activeOrgId'),
}

const orgSlice = createSlice({
  name: 'org',
  initialState,
  reducers: {
    setActiveOrganization: (state, action: PayloadAction<string | null>) => {
      state.activeOrganizationId = action.payload
      if (action.payload) {
        localStorage.setItem('activeOrgId', action.payload)
      } else {
        localStorage.removeItem('activeOrgId')
      }
    },
  },
})

export const { setActiveOrganization } = orgSlice.actions
export default orgSlice.reducer
