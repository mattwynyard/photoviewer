import { configureStore } from '@reduxjs/toolkit'
import layersReducer from './reducers/layersSlice'
import mapReducer from './reducers/mapSlice'
import videoReducer from './reducers/videoSlice'

export const store = configureStore({
    reducer: {
      layers: layersReducer,
      map: mapReducer,
      video: videoReducer
    }
  })