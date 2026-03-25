import SendRoundedIcon from '@mui/icons-material/SendRounded'
import { Box, FormControl, MenuItem, Select } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { formatModelShortLabel } from '../utils/formatters'

export default function ChatComposer({
  availableModels,
  input,
  inputRef,
  isModelsLoading,
  isTyping,
  onInputChange,
  onModelChange,
  onSubmit,
  selectedModel,
}) {
  return (
    <Box className="input-dock">
      <Card
        className="input-surface"
        sx={{
          bgcolor: alpha('#ffffff', 0.9),
          border: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: '0 16px 48px rgba(15, 23, 42, 0.12)',
        }}
      >
        <Box
          component="form"
          className="input-row"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <Box className="input-model-slot">
            <FormControl fullWidth size="small">
              <Select
                value={selectedModel}
                displayEmpty
                onChange={(event) => onModelChange(event.target.value)}
                disabled={
                  isModelsLoading || availableModels.length === 0 || isTyping
                }
                className="input-model-select"
                renderValue={(value) => {
                  if (!value) {
                    return isModelsLoading ? 'Loading...' : 'Model'
                  }

                  return (
                    <>
                      <span className="desktop-model-label">{value}</span>
                      <span className="mobile-model-label">
                        {formatModelShortLabel(value)}
                      </span>
                    </>
                  )
                }}
              >
                {availableModels.map((model) => (
                  <MenuItem key={model.id} value={model.id}>
                    {model.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Input
            ref={inputRef}
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder={
              availableModels.length === 0 && !isModelsLoading
                ? 'No supported Gemini models found for this API key.'
                : 'Type your message...'
            }
            className="chat-input"
            aria-label="Chat message input"
          />

          <Button
            type="submit"
            className="chat-send-button"
            disabled={!input.trim() || isTyping || isModelsLoading || !selectedModel}
          >
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
              <SendRoundedIcon fontSize="small" />
            </Box>
            Send
          </Button>
        </Box>
      </Card>
    </Box>
  )
}
