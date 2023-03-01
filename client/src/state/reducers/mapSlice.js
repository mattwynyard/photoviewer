import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    class: "map", 
    mode: "map", 
    centre: {
        lat: -41.2728,
        lng: 173.2995,
    }
}

const mapSlice = createSlice({
    name: "map",
    initialState: initialState,
    reducers: {
        setClassName: (s, a) => {
            s.class = a.payload
        },
        setMode: (s, a) => {
            s.mode = a.payload
        },
        setCentre: (s, a) => {
            s.centre.lat = a.payload.lat
            s.centre.lng = a.payload.lng
        },
    }

})

export const { setClassName, setMode, setCentre } = mapSlice.actions
export default mapSlice.reducer