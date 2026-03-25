import { Box, Stack } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Card, CardContent } from '../../../components/ui/card'
import EmptyChatState from './EmptyChatState'
import MessageBubble from './MessageBubble'
import MessageContent from './MessageContent'
import TypingIndicator from './TypingIndicator'

export default function ChatMessages({
  isStreaming,
  isTyping,
  messages,
  messagesScrollRef,
  streamingText,
}) {
  const isEmpty = messages.length === 0

  return (
    <Box
      ref={messagesScrollRef}
      className={`messages-scroll ${isEmpty ? 'messages-scroll-empty' : ''}`}
    >
      {isEmpty ? (
        <EmptyChatState />
      ) : (
        <Stack spacing={1.6} className="messages-stack">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isTyping ? (
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
                  background:
                    'linear-gradient(135deg, rgba(22, 163, 74, 0.96), rgba(21, 128, 61, 0.96))',
                  color: '#fff',
                }}
              >
                <CardContent className="chat-bubble-content">
                  {isStreaming ? (
                    <>
                      <MessageContent text={streamingText} />
                      <TypingIndicator />
                    </>
                  ) : (
                    <TypingIndicator />
                  )}
                </CardContent>
              </Card>
            </Box>
          ) : null}
        </Stack>
      )}
    </Box>
  )
}
