import { createSlice } from '@reduxjs/toolkit'

const chatBotSlice = createSlice({
  name: 'chatBot',
  initialState: {
    messages: [],
  },
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload)
    },
  },
})

export const { addMessage } = chatBotSlice.actions
export default chatBotSlice.reducer
