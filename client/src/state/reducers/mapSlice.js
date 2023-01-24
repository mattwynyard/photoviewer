import { createSlice } from "@reduxjs/toolkit";

const initialState = {class: "map"}

const mapSlice = createSlice({
    name: "className",
    initialState: initialState,
    reducers: {
        setClassName: (s, a) => {
            s.class = a.payload.class
        }
    }

})

export const { setClassName } = mapSlice.actions
export default mapSlice.reducer