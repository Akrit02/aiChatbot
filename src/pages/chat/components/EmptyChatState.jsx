import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded'
import { Avatar, Box, Chip, Stack, Typography } from '@mui/material'

export default function EmptyChatState() {
  return (
    <Box className="empty-state message-animate">
      <Box className="empty-state-panel">
        <Avatar
          className="empty-state-avatar"
          sx={{ bgcolor: '#0f172a', width: 64, height: 64 }}
        >
          <SmartToyRoundedIcon />
        </Avatar>
        <Typography variant="overline" className="empty-state-kicker">
          Quick start
        </Typography>
        <Typography variant="h5" className="empty-state-title">
          Start with a simple prompt
        </Typography>
        <Typography variant="body1" className="empty-state-copy">
          Ask a question, draft something, or summarize notes. The layout stays
          quiet so the conversation gets most of the space.
        </Typography>
        <Stack direction="row" spacing={1} className="empty-state-chips">
          <Chip label="Explain a concept" className="empty-chip" />
          <Chip label="Draft a reply" className="empty-chip" />
          <Chip label="Summarize notes" className="empty-chip" />
        </Stack>
      </Box>
    </Box>
  )
}
