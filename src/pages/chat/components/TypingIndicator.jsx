import { Stack } from '@mui/material'

export default function TypingIndicator() {
  return (
    <Stack
      direction="row"
      spacing={0.75}
      className="typing-indicator"
      aria-label="Bot is typing"
    >
      <span />
      <span />
      <span />
    </Stack>
  )
}
