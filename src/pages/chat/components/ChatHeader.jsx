import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import { Box, Stack, Typography } from '@mui/material'
import { Button } from '../../../components/ui/button'
import { formatModelLabel } from '../utils/formatters'

export default function ChatHeader({
  hasMessages,
  isTyping,
  lastError,
  mode,
  modelsErrorMessage,
  onResetChat,
  onToggleTheme,
  selectedModel,
}) {
  const statusLabel = isTyping ? 'Thinking' : lastError ? 'Attention' : 'Online'
  const statusClassName = isTyping
    ? 'status-pill-thinking'
    : lastError
      ? 'status-pill-error'
      : 'status-pill-online'
  const hasHeaderMeta = Boolean(modelsErrorMessage || selectedModel)

  return (
    <Box
      className={`chat-header ${hasMessages ? 'chat-header-compact' : 'chat-header-welcome'}`}
    >
      <Box className="chat-header-main">
        <Typography variant="overline" className="chat-header-kicker">
          {hasMessages ? 'Current chat' : 'AI Assistant'}
        </Typography>
        <Typography variant="h4" className="chat-header-title">
          {hasMessages ? "Let's continue" : 'Ask anything'}
        </Typography>
        {!hasMessages ? (
          <>
            <Typography variant="body2" className="chat-header-copy">
              A calm, focused workspace for quick answers and longer conversations.
            </Typography>
            <Typography variant="caption" className="chat-header-signature">
              Crafted by Akrit Ujjainiya
            </Typography>
          </>
        ) : null}
        {hasHeaderMeta ? (
          <Stack direction="row" spacing={1} className="chat-header-meta">
            {modelsErrorMessage ? (
              <Typography
                variant="caption"
                className="model-helper chat-meta-pill chat-meta-pill-error"
              >
                {modelsErrorMessage}
              </Typography>
            ) : null}
            {!modelsErrorMessage && selectedModel ? (
              <Typography variant="caption" className="model-helper chat-meta-pill">
                Model: {formatModelLabel(selectedModel)}
              </Typography>
            ) : null}
          </Stack>
        ) : null}
      </Box>

      <Stack
        direction="row"
        spacing={1.25}
        alignItems="center"
        className="chat-header-actions"
      >
        <Button
          type="button"
          className="theme-toggle-button chat-action-button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
        >
          <Box component="span" className="chat-action-icon">
            {mode === 'dark' ? (
              <LightModeRoundedIcon fontSize="small" />
            ) : (
              <DarkModeRoundedIcon fontSize="small" />
            )}
          </Box>
          <Box component="span" className="chat-action-label">
            {mode === 'dark' ? 'Light' : 'Dark'}
          </Box>
        </Button>

        {hasMessages ? (
          <Button
            type="button"
            className="clear-chat-button chat-action-button"
            onClick={onResetChat}
            aria-label="Start a new chat"
          >
            <Box component="span" className="chat-action-icon">
              <RefreshRoundedIcon fontSize="small" />
            </Box>
            <Box component="span" className="chat-action-label">
              New chat
            </Box>
          </Button>
        ) : null}

        <Box className={`status-pill ${statusClassName}`}>{statusLabel}</Box>
      </Stack>
    </Box>
  )
}
