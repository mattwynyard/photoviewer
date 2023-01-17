import { configureStore } from '@reduxjs/toolkit'
import layersReducer from './reducers/layersSlice'

export const store = configureStore({
    reducer: {
      layers: layersReducer,
    }
  })