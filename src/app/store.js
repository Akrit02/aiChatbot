import { configureStore } from '@reduxjs/toolkit'
import chatReducer from '../features/chat/chatSlice'
import { chatApi } from '../features/chat/chatApi'

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    [chatApi.reducerPath]: chatApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(chatApi.middleware),
})
