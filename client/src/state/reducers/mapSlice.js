import { createSlice } from "@reduxjs/toolkit";

const initialState = {class: "map", mode: "map"}

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
    }

})

export const { setClassName, setMode } = mapSlice.actions
export default mapSlice.reducer