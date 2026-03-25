import { configureStore } from '@reduxjs/toolkit'
import { chatApi } from './api/chatApi'
import chatReducer from './slices/chatSlice'

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    [chatApi.reducerPath]: chatApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(chatApi.middleware),
})
