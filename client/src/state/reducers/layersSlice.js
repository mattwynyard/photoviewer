import { createSlice } from "@reduxjs/toolkit";

const initialState = {active : null, layers: []}

const activeLayerSlice = createSlice({
    name: "activeLayer",
    initialState: initialState,
    reducers: {
        setLayer: (s, a) => {
            s.active = s.layers.find(({ code }) => code === a.payload.code)
        },
        addLayer: (s, a) => {
            s.layers.push(a.payload)
            s.active = s.layers.find(({ code }) => code === a.payload.code)
        },
        removeLayer: (s, a) => {
            const index = s.layers.findIndex(({ code }) => code === a.payload.code)
            if (index > -1) { 
                s.layers.splice(index, 1); 
                s.active = null
            }       
        }
    }

})

export const { setLayer, addLayer, removeLayer} = activeLayerSlice.actions
export default activeLayerSlice.reducer