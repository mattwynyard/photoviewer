import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    showDownload: false, isDownloading: false, request: null
}

const downloadSlice = createSlice({
    name: "download",
    initialState: initialState,
    reducers: {
        setOpenDownload: (s, a) => {
            s.showDownload = a.payload.show
            s.request = a.payload.request
        },
        setIsDownloading: (s, a) => {
            s.showDownload = a.payload
        },
        setRequest: (s, a) => {
            s.request = a.payload
        }
    }
})

export const { setOpenDownload, setIsDownloading, setRequest } = downloadSlice.actions
export default downloadSlice.reducer