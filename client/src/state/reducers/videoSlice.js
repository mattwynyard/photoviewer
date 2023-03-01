import { createSlice } from "@reduxjs/toolkit";

const initialState = {isOpen: false}

const videoSlice = createSlice({
    name: "video",
    initialState: initialState,
    reducers: {
        setIsOpen: (s, a) => {
            s.isOpen = a.payload
        }
    }
})

export const { setIsOpen } = videoSlice.actions
export default videoSlice.reducer