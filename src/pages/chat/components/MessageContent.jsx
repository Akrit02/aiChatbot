import { Box, Typography } from '@mui/material'

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
          <strong
            key={`${boldPart}-${codeIndex}-${boldIndex}`}
            className="message-strong"
          >
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
  const isBulletList = lines.every((line) =>
    /^(\s*[-*]|\s*\d+\.)\s+/.test(line),
  )
  const isHeading = /^#{1,3}\s+/.test(block.trim())

  if (isBulletList) {
    return (
      <Box component="ul" className="message-list">
        {lines.map((line, index) => (
          <li key={`${line}-${index}`}>
            {renderInlineText(line.replace(/^(\s*[-*]|\s*\d+\.)\s+/, ''))}
          </li>
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

export default function MessageContent({ text }) {
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
