import { Box, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Card, CardContent } from '../../../components/ui/card'
import MessageContent from './MessageContent'

export default function MessageBubble({ message }) {
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
          <MessageContent text={message.text} />
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
