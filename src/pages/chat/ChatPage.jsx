import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded'
import { Avatar, Box, CssBaseline, Stack, ThemeProvider } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Card } from '../../components/ui/card'
import ChatComposer from './components/ChatComposer'
import ChatHeader from './components/ChatHeader'
import ChatMessages from './components/ChatMessages'
import { useChatPage } from './hooks/useChatPage'
import './ChatPage.css'

export default function ChatPage() {
  const {
    availableModels,
    handleResetChat,
    handleSend,
    input,
    inputRef,
    isModelsLoading,
    isStreaming,
    isTyping,
    lastError,
    messages,
    messagesScrollRef,
    mode,
    modelsErrorMessage,
    selectedModel,
    setInput,
    setMode,
    setSelectedModel,
    streamingText,
    theme,
  } = useChatPage()

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        className={`chatbot-shell ${mode === 'dark' ? 'theme-dark' : 'theme-light'}`}
      >
        <Box className="chatbot-backdrop" />

        <Card
          className="chatbot-frame"
          sx={{
            bgcolor:
              mode === 'dark' ? alpha('#020617', 0.9) : alpha('#ffffff', 0.78),
            backdropFilter: 'blur(22px)',
            border:
              mode === 'dark'
                ? '1px solid rgba(148,163,184,0.1)'
                : '1px solid rgba(255,255,255,0.65)',
            boxShadow:
              mode === 'dark' ? 'none' : '0 28px 90px rgba(15, 23, 42, 0.12)',
            width: '100vw',
            height: '100dvh',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '108px 1fr' },
              height: '100%',
            }}
          >
            <Box className="avatar-rail">
              <Avatar
                className="avatar-rail-main"
                sx={{
                  bgcolor: mode === 'dark' ? '#dbeafe' : '#0f172a',
                  color: mode === 'dark' ? '#1d4ed8' : '#ffffff',
                  width: 54,
                  height: 54,
                }}
              >
                <SmartToyRoundedIcon />
              </Avatar>

              <Stack spacing={1.25} alignItems="center" className="avatar-rail-actions">
                <Avatar
                  className="avatar-rail-chip"
                  sx={{
                    bgcolor: mode === 'dark' ? '#e0e7ff' : '#dbeafe',
                    color: '#1d4ed8',
                    width: 42,
                    height: 42,
                  }}
                >
                  <PersonRoundedIcon fontSize="small" />
                </Avatar>
                <Avatar
                  className="avatar-rail-chip"
                  sx={{
                    bgcolor: '#dcfce7',
                    color: '#15803d',
                    width: 42,
                    height: 42,
                  }}
                >
                  <SmartToyRoundedIcon fontSize="small" />
                </Avatar>
              </Stack>
            </Box>

            <Box className="chat-panel">
              <ChatHeader
                hasMessages={messages.length > 0}
                isTyping={isTyping}
                lastError={lastError}
                mode={mode}
                modelsErrorMessage={modelsErrorMessage}
                onResetChat={handleResetChat}
                onToggleTheme={() =>
                  setMode((currentMode) =>
                    currentMode === 'dark' ? 'light' : 'dark',
                  )
                }
                selectedModel={selectedModel}
              />

              <ChatMessages
                isStreaming={isStreaming}
                isTyping={isTyping}
                messages={messages}
                messagesScrollRef={messagesScrollRef}
                streamingText={streamingText}
              />

              <ChatComposer
                availableModels={availableModels}
                input={input}
                inputRef={inputRef}
                isModelsLoading={isModelsLoading}
                isTyping={isTyping}
                onInputChange={setInput}
                onModelChange={setSelectedModel}
                onSubmit={handleSend}
                selectedModel={selectedModel}
              />
            </Box>
          </Box>
        </Card>
      </Box>
    </ThemeProvider>
  )
}
