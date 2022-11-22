import { configureStore } from '@reduxjs/toolkit'
import activeLayerSliceReducer from './reducers/activeLayerSlice'
import layersReducer from './reducers/layersSlice'

export const store = configureStore({
    reducer: {
      activeLayer: activeLayerSliceReducer,
      layers: layersReducer,
    }
  })