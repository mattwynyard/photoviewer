import { configureStore } from '@reduxjs/toolkit'
import activeLayerSliceReducer from './reducers/activeLayerSlice'

export const store = configureStore({
    reducer: {
      activeLayer: activeLayerSliceReducer,
    }
  })