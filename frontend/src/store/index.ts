import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import orgReducer from './slices/orgSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    org: orgReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

import { useDispatch, useSelector } from 'react-redux'
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
