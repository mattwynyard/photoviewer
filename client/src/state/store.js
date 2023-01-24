import { configureStore } from '@reduxjs/toolkit'
import layersReducer from './reducers/layersSlice'
import mapReducer from './reducers/mapSlice'

export const store = configureStore({
    reducer: {
      layers: layersReducer,
      map: mapReducer,
    }
  })