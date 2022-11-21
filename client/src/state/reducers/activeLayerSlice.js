import { createSlice } from "@reduxjs/toolkit";

const initialState = {value : {layer: null}}

const activeLayerSlice = createSlice({
    name: "activeLayer",
    initialState: initialState,
    reducers: {
        setLayer: (s, a) => {
            s.layer = a.payload
        }
    }

})

export const { setLayer } = activeLayerSlice.actions
export default activeLayerSlice.reducer