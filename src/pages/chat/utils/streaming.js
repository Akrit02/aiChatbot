import { GEMINI_API_KEY, GEMINI_BASE_URL } from '../../../config/gemini'
import { toGeminiContents } from './chatHelpers'

const sseEventDelimiter = /\r?\n\r?\n/

function waitForNextPaint() {
  if (typeof window === 'undefined') {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve())
  })
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

function extractSseData(eventText) {
  const dataLines = eventText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .filter(Boolean)

  return dataLines.join('\n')
}

function applySseEventChunk(eventText, currentText) {
  const data = extractSseData(eventText)

  if (!data || data === '[DONE]') {
    return currentText
  }

  const payload = JSON.parse(data)
  const chunkPayloads = Array.isArray(payload) ? payload : [payload]
  let nextText = currentText

  for (const chunkPayload of chunkPayloads) {
    const chunkText = extractTextFromChunk(chunkPayload)
    nextText = mergeChunkText(nextText, chunkText)
  }

  return nextText
}

export async function streamChatReply({
  model,
  messages,
  nextUserText,
  onText,
}) {
  const response = await fetch(
    `${GEMINI_BASE_URL}/${model}:streamGenerateContent?alt=sse`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: toGeminiContents(messages, nextUserText),
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
  let textUpdateCount = 0

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split(sseEventDelimiter)
    buffer = events.pop() ?? ''

    for (const event of events) {
      const nextText = applySseEventChunk(event, accumulatedText)

      if (nextText === accumulatedText) {
        continue
      }

      accumulatedText = nextText
      textUpdateCount += 1
      onText(accumulatedText)
      await waitForNextPaint()
    }
  }

  buffer += decoder.decode()

  if (buffer.trim()) {
    const nextText = applySseEventChunk(buffer, accumulatedText)

    if (nextText !== accumulatedText) {
      accumulatedText = nextText
      textUpdateCount += 1
      onText(accumulatedText)
      await waitForNextPaint()
    }
  }

  return {
    reply: accumulatedText,
    textUpdateCount,
  }
}
