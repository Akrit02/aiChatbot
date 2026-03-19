import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Avatar,
  Box,
  Chip,
  CssBaseline,
  FormControl,
  MenuItem,
  Select,
  Stack,
  ThemeProvider,
  Typography,
  alpha,
  createTheme,
} from '@mui/material'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import { Button } from './components/ui/button'
import { Card, CardContent } from './components/ui/card'
import { Input } from './components/ui/input'
import { useGetModelsQuery } from './features/chat/chatApi'
import {
  addBotMessage,
  addUserMessage,
  markMessageError,
  resetChat,
  setBotTyping,
  setLastError,
} from './features/chat/chatSlice'
import {
  selectBotTyping,
  selectLastError,
  selectMessages,
} from './features/chat/selectors'
import './App.css'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY ?? ''
const baseUrl = import.meta.env.VITE_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta/models'

function formatTime(date) {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatModelLabel(modelId) {
  if (!modelId) {
    return ''
  }

  return modelId
    .replace(/^gemini-/, '')
    .replace(/-latest$/, '')
    .replace(/-/g, ' ')
}

function formatModelShortLabel(modelId) {
  const label = formatModelLabel(modelId)
  const compact = label
    .replace('flash lite', 'lite')
    .replace('flash', 'flash')
    .replace('preview', '')
    .trim()

  return compact.length > 10 ? compact.slice(0, 10).trim() : compact
}

function TypingIndicator() {
  return (
    <Stack direction="row" spacing={0.75} className="typing-indicator" aria-label="Bot is typing">
      <span />
      <span />
      <span />
    </Stack>
  )
}

function getFriendlyErrorMessage(error) {
  const status = error?.status
  const apiMessage = error?.data?.error?.message ?? error?.data?.message

  if (status === 429) {
    return 'Gemini request limit reached for this key or project. Check the model quota and billing, then try again.'
  }

  if (status === 400) {
    return apiMessage || 'The request was rejected by Gemini. Check the payload format and selected model.'
  }

  if (status === 401 || status === 403) {
    return 'Gemini API key is missing, invalid, or blocked for this project.'
  }

  if (status === 'FETCH_ERROR') {
    return 'Network request failed. Check your connection, CORS settings, or whether the API endpoint is reachable.'
  }

  if (status === 'PARSING_ERROR') {
    return 'Gemini returned an unexpected response format. Verify the model response and parsing logic.'
  }

  return apiMessage || error?.error || 'Something went wrong while sending the message. Please try again.'
}

function toGeminiContents(messages, nextUserText) {
  const history = [
    {
      role: 'user',
      parts: [
        {
          text: 'You are a helpful chat assistant. Always reply in the same language, tone, and style as the user. If the user writes in Hindi, reply in Hindi. If the user writes in Hinglish, reply naturally in Hinglish. If the user writes in English, reply in English. Do not switch languages unless the user asks you to. You may use light, natural emojis when they fit the conversation, but do not overuse them. If the user message is short, slang-heavy, or ambiguous, interpret it in normal chat context first and ask a brief clarification only if absolutely necessary.',
        },
      ],
    },
    ...messages
    .filter((message) => message.status !== 'error')
    .map((message) => ({
      role: message.role === 'bot' ? 'model' : 'user',
      parts: [{ text: message.text }],
    })),
  ]

  history.push({
    role: 'user',
    parts: [{ text: nextUserText }],
  })

  return history
}

function extractTextFromChunk(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts ?? []
  return parts
    .map((part) => part?.text)
    .filter(Boolean)
    .join('\n')
}

function mergeChunkText(currentText, incomingText) {
  if (!incomingText) {
    return currentText
  }

  if (!currentText) {
    return incomingText
  }

  if (incomingText.startsWith(currentText)) {
    return incomingText
  }

  return `${currentText}${incomingText}`
}

function applySseEventChunk(eventText, currentText, onText) {
  const lines = eventText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  let nextText = currentText

  for (const line of lines) {
    if (!line.startsWith('data:')) {
      continue
    }

    const data = line.slice(5).trim()

    if (!data || data === '[DONE]') {
      continue
    }

    const payload = JSON.parse(data)
    const chunkPayloads = Array.isArray(payload) ? payload : [payload]

    for (const chunkPayload of chunkPayloads) {
      const chunkText = extractTextFromChunk(chunkPayload)
      nextText = mergeChunkText(nextText, chunkText)
    }
  }

  onText(nextText)
  return nextText
}

function renderInlineText(text) {
  const codeParts = text.split(/(`[^`]+`)/g)

  return codeParts.map((codePart, codeIndex) => {
    if (codePart.startsWith('`') && codePart.endsWith('`')) {
      return (
        <code key={`${codePart}-${codeIndex}`} className="message-inline-code">
          {codePart.slice(1, -1)}
        </code>
      )
    }

    const boldParts = codePart.split(/(\*\*[^*]+\*\*)/g)

    return boldParts.map((boldPart, boldIndex) => {
      if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
        return (
          <strong key={`${boldPart}-${codeIndex}-${boldIndex}`} className="message-strong">
            {boldPart.slice(2, -2)}
          </strong>
        )
      }

      return boldPart
    })
  })
}

function renderTextBlock(block) {
  const lines = block.split('\n')
  const isBulletList = lines.every((line) => /^(\s*[-*]|\s*\d+\.)\s+/.test(line))
  const isHeading = /^#{1,3}\s+/.test(block.trim())

  if (isBulletList) {
    return (
      <Box component="ul" className="message-list">
        {lines.map((line, index) => (
          <li key={`${line}-${index}`}>{renderInlineText(line.replace(/^(\s*[-*]|\s*\d+\.)\s+/, ''))}</li>
        ))}
      </Box>
    )
  }

  if (isHeading) {
    return (
      <Typography variant="h6" className="message-heading">
        {renderInlineText(block.replace(/^#{1,3}\s+/, ''))}
      </Typography>
    )
  }

  return (
    <Typography
      variant="body1"
      className="message-paragraph"
      sx={{
        fontSize: '0.98rem',
        lineHeight: 1.7,
        wordBreak: 'break-word',
      }}
    >
      {renderInlineText(block)}
    </Typography>
  )
}

function RenderMessageContent({ text }) {
  const segments = text.split(/```([\w-]*)\n?([\s\S]*?)```/g)
  const content = []

  for (let index = 0; index < segments.length; index += 3) {
    const prose = segments[index]

    if (prose?.trim()) {
      const blocks = prose
        .trim()
        .split(/\n{2,}/)
        .filter(Boolean)

      blocks.forEach((block, blockIndex) => {
        content.push(
          <Box key={`text-${index}-${blockIndex}`} className="message-block">
            {renderTextBlock(block)}
          </Box>,
        )
      })
    }

    const language = segments[index + 1]
    const code = segments[index + 2]

    if (typeof code === 'string') {
      content.push(
        <Box key={`code-${index}`} className="message-code-wrap">
          {language ? <Box className="message-code-label">{language}</Box> : null}
          <Box component="pre" className="message-code-block">
            <code>{code.trim()}</code>
          </Box>
        </Box>,
      )
    }
  }

  return content
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const isError = message.status === 'error'

  return (
    <Box
      className="message-animate"
      sx={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        width: '100%',
        maxWidth: { xs: '100%', sm: '85%', md: '76%' },
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <Card
        className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-bot'}`}
        sx={{
          width: 'fit-content',
          maxWidth: '100%',
          border: '1px solid',
          borderColor: isError
            ? alpha('#fca5a5', 0.5)
            : isUser
              ? alpha('#60a5fa', 0.4)
              : alpha('#86efac', 0.45),
          background: isError
            ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
            : isUser
              ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
              : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
          color: '#fff',
          boxShadow: isError
            ? '0 16px 40px rgba(220, 38, 38, 0.18)'
            : isUser
              ? '0 16px 40px rgba(37, 99, 235, 0.22)'
              : '0 16px 40px rgba(22, 163, 74, 0.18)',
        }}
      >
        <CardContent className="chat-bubble-content">
          <RenderMessageContent text={message.text} />
          <Typography
            component="span"
            sx={{
              mt: 1.25,
              display: 'inline-block',
              fontSize: '0.72rem',
              color: alpha('#ffffff', 0.8),
              letterSpacing: '0.04em',
            }}
          >
            {message.timestamp}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

function App() {
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [streamingText, setStreamingText] = useState('')
  const [streamTargetText, setStreamTargetText] = useState('')
  const [mode, setMode] = useState(() => window.localStorage.getItem('chat-theme') ?? 'light')
  const dispatch = useDispatch()
  const messages = useSelector(selectMessages)
  const isTyping = useSelector(selectBotTyping)
  const lastError = useSelector(selectLastError)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const {
    data: availableModels = [],
    error: modelsError,
    isLoading: isModelsLoading,
  } = useGetModelsQuery()
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#2563eb',
          },
          secondary: {
            main: '#16a34a',
          },
          background: {
            default: mode === 'dark' ? '#020617' : '#f3f7fb',
            paper: mode === 'dark' ? '#0f172a' : '#ffffff',
          },
        },
        shape: {
          borderRadius: 24,
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Segoe UI", sans-serif',
        },
      }),
    [mode],
  )

  useEffect(() => {
    if (!selectedModel && availableModels.length > 0) {
      setSelectedModel(availableModels[0].id)
    }
  }, [availableModels, selectedModel])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    window.localStorage.setItem('chat-theme', mode)
  }, [mode])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    })
  }, [messages, isTyping, streamingText])

  useEffect(() => {
    if (!isTyping) {
      setStreamTargetText('')
      return
    }

    if (streamingText.length >= streamTargetText.length) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      const remaining = streamTargetText.length - streamingText.length
      const step = remaining > 240 ? 20 : remaining > 120 ? 12 : remaining > 40 ? 8 : 4
      const nextLength = Math.min(streamTargetText.length, streamingText.length + step)
      setStreamingText(streamTargetText.slice(0, nextLength))
    }, 10)

    return () => window.clearTimeout(timeoutId)
  }, [isTyping, streamTargetText, streamingText])

  const isStreaming = isTyping && Boolean(streamingText)

  const handleSend = async () => {
    const trimmed = input.trim()

    if (!trimmed) {
      return
    }

    if (!selectedModel) {
      dispatch(setLastError('Select a Gemini model before sending a message.'))
      return
    }

    const messageId = Date.now()
    dispatch(setLastError(null))

    dispatch(
      addUserMessage({
        id: messageId,
        role: 'user',
        text: trimmed,
        timestamp: formatTime(new Date()),
        status: 'sent',
      }),
    )
    setInput('')
    dispatch(setBotTyping(true))
    setStreamingText('')
    setStreamTargetText('')

    try {
      const response = await fetch(
        `${baseUrl}/${selectedModel}:streamGenerateContent?alt=sse`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: toGeminiContents(messages, trimmed),
          }),
        },
      )

      if (!response.ok || !response.body) {
        let errorPayload = null

        try {
          errorPayload = await response.json()
        } catch {
          errorPayload = null
        }

        throw {
          status: response.status,
          data: errorPayload,
        }
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulatedText = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''

        for (const event of events) {
          accumulatedText = applySseEventChunk(event, accumulatedText, setStreamTargetText)
        }
      }

      if (buffer.trim()) {
        accumulatedText = applySseEventChunk(buffer, accumulatedText, setStreamTargetText)
      }

      dispatch(
        addBotMessage({
          id: Date.now() + 1,
          role: 'bot',
          text: accumulatedText || streamTargetText || 'No response from Gemini.',
          timestamp: formatTime(new Date()),
          status: 'sent',
        }),
      )
      setStreamingText('')
      setStreamTargetText('')
    } catch (error) {
      const friendlyError = getFriendlyErrorMessage(error)
      dispatch(markMessageError(messageId))
      dispatch(setLastError(friendlyError))
      setStreamingText('')
      setStreamTargetText('')
      dispatch(
        addBotMessage({
          id: Date.now() + 1,
          role: 'bot',
          text: friendlyError,
          timestamp: formatTime(new Date()),
          status: 'error',
        }),
      )
    } finally {
      dispatch(setBotTyping(false))
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className={`chatbot-shell ${mode === 'dark' ? 'theme-dark' : 'theme-light'}`}>
        <Box className="chatbot-backdrop" />

        <Card
          className="chatbot-frame"
          sx={{
            bgcolor: mode === 'dark' ? alpha('#020617', 0.9) : alpha('#ffffff', 0.78),
            backdropFilter: 'blur(22px)',
            border: mode === 'dark' ? '1px solid rgba(148,163,184,0.1)' : '1px solid rgba(255,255,255,0.65)',
            boxShadow: mode === 'dark' ? 'none' : '0 28px 90px rgba(15, 23, 42, 0.12)',
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
                    bgcolor: mode === 'dark' ? '#dcfce7' : '#dcfce7',
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
              <Box className="chat-header">
                <Box>
                  <Typography variant="overline" className="chat-header-kicker">
                    AI Assistant
                  </Typography>
                  <Typography variant="h4" className="chat-header-title">
                    Ask anything
                  </Typography>
                  <Typography variant="body2" className="chat-header-copy">
                    Get quick answers, continue conversations, and keep everything in one clean workspace.
                  </Typography>
                  {modelsError && (
                    <Typography variant="caption" className="model-helper error-text">
                      {getFriendlyErrorMessage(modelsError)}
                    </Typography>
                  )}
                  {!modelsError && selectedModel && (
                    <Typography variant="caption" className="model-helper">
                      Using: {selectedModel}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Button
                    type="button"
                    className="theme-toggle-button"
                    onClick={() => setMode((current) => (current === 'dark' ? 'light' : 'dark'))}
                  >
                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                      {mode === 'dark' ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
                    </Box>
                    {mode === 'dark' ? 'Light' : 'Dark'}
                  </Button>
                  {messages.length > 0 && (
                    <Button
                      type="button"
                      className="clear-chat-button"
                      onClick={() => dispatch(resetChat())}
                    >
                      Clear chat
                    </Button>
                  )}
                  <Box className="status-pill">
                    {isTyping ? 'Thinking' : lastError ? 'Attention' : 'Online'}
                  </Box>
                </Stack>
              </Box>

              <Box className="messages-scroll">
                {messages.length === 0 ? (
                  <Box className="empty-state message-animate">
                    <Avatar className="empty-state-avatar" sx={{ bgcolor: '#0f172a', width: 64, height: 64 }}>
                      <SmartToyRoundedIcon />
                    </Avatar>
                    <Typography variant="h5" className="empty-state-title">
                      Start a new conversation
                    </Typography>
                    <Typography variant="body1" className="empty-state-copy">
                      Ask a question, brainstorm ideas, or drop in a prompt to get a response from Gemini.
                    </Typography>
                    <Stack direction="row" spacing={1} className="empty-state-chips">
                      <Chip label="Explain a concept" className="empty-chip" />
                      <Chip label="Draft a reply" className="empty-chip" />
                      <Chip label="Summarize notes" className="empty-chip" />
                    </Stack>
                  </Box>
                ) : (
                  <Stack spacing={1.6}>
                    {messages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))}

                    {isTyping && (
                      <Box
                        className="message-animate"
                        sx={{
                          alignSelf: 'flex-start',
                          maxWidth: 'fit-content',
                        }}
                      >
                        <Card
                          className="chat-bubble chat-bubble-bot"
                          sx={{
                            border: '1px solid',
                            borderColor: alpha('#86efac', 0.45),
                            background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.96), rgba(21, 128, 61, 0.96))',
                            color: '#fff',
                          }}
                        >
                          <CardContent className="chat-bubble-content">
                            {isStreaming ? (
                              <>
                                <RenderMessageContent text={streamingText} />
                                <TypingIndicator />
                              </>
                            ) : (
                              <TypingIndicator />
                            )}
                          </CardContent>
                        </Card>
                      </Box>
                    )}
                  </Stack>
                )}
                <div ref={messagesEndRef} />
              </Box>

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
                      handleSend()
                    }}
                  >
                    <Box className="input-model-slot">
                      <FormControl fullWidth size="small">
                        <Select
                          value={selectedModel}
                          displayEmpty
                          onChange={(event) => setSelectedModel(event.target.value)}
                          disabled={isModelsLoading || availableModels.length === 0 || isTyping}
                          className="input-model-select"
                          renderValue={(value) => {
                            if (!value) {
                              return isModelsLoading ? 'Loading...' : 'Model'
                            }
                            return (
                              <>
                                <span className="desktop-model-label">{value}</span>
                                <span className="mobile-model-label">{formatModelShortLabel(value)}</span>
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
                      onChange={(event) => setInput(event.target.value)}
                      placeholder={
                        availableModels.length === 0 && !isModelsLoading
                          ? 'No supported Gemini models found for this API key.'
                          : 'Type your message...'
                      }
                      className="chat-input"
                      aria-label="Chat message input"
                      disabled={isTyping}
                    />

                    <Button
                      type="submit"
                      className="chat-send-button"
                      disabled={!input.trim() || isTyping || isModelsLoading || !selectedModel}
                    >
                      <Box
                        component="span"
                        sx={{ display: 'inline-flex', alignItems: 'center' }}
                      >
                        <SendRoundedIcon fontSize="small" />
                      </Box>
                      Send
                    </Button>
                  </Box>
                </Card>
              </Box>
            </Box>
          </Box>
        </Card>
      </Box>
    </ThemeProvider>
  )
}

export default App
