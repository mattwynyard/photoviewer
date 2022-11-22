import { createSlice } from "@reduxjs/toolkit";

//const initialState = {value : []}

const layersSlice = createSlice({
    name: "layers",
    initialState: [],
    reducers: {
        addLayer: (s, a) => {
            s.push(a.payload)
        }
    }

})

export const { addLayer } = layersSlice.actions
export default layersSlice.reducer