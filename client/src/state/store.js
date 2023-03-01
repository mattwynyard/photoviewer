import { configureStore } from '@reduxjs/toolkit'
import layersReducer from './reducers/layersSlice'
import mapReducer from './reducers/mapSlice'
import videoReducer from './reducers/videoSlice'
import downloadReducer from './reducers/downloadSlice'

export const store = configureStore({
    reducer: {
      layers: layersReducer,
      map: mapReducer,
      video: videoReducer,
      download: downloadReducer,
    }
  })