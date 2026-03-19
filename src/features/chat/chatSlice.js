import { createSlice } from '@reduxjs/toolkit'

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const initialState = {
  conversationId: null,
  isBotTyping: false,
  lastError: null,
  messages: [],
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addUserMessage: (state, action) => {
      state.lastError = null
      state.messages.push({
        status: 'sent',
        timestamp: formatTime(),
        ...action.payload,
      })
    },
    addBotMessage: (state, action) => {
      state.lastError = null
      state.messages.push({
        status: 'sent',
        timestamp: formatTime(),
        ...action.payload,
      })
    },
    setBotTyping: (state, action) => {
      state.isBotTyping = action.payload
    },
    setLastError: (state, action) => {
      state.lastError = action.payload
    },
    setConversationId: (state, action) => {
      state.conversationId = action.payload
    },
    markMessageError: (state, action) => {
      const message = state.messages.find((item) => item.id === action.payload)
      if (message) {
        message.status = 'error'
      }
    },
    resetChat: (state) => {
      state.messages = []
      state.isBotTyping = false
      state.lastError = null
      state.conversationId = null
    },
  },
})

export const {
  addBotMessage,
  addUserMessage,
  markMessageError,
  resetChat,
  setBotTyping,
  setLastError,
  setConversationId,
} = chatSlice.actions

export default chatSlice.reducer
