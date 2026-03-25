export function getFriendlyErrorMessage(error) {
  const status = error?.status
  const apiMessage = error?.data?.error?.message ?? error?.data?.message

  if (status === 429) {
    return 'Gemini request limit reached for this key or project. Check the model quota and billing, then try again.'
  }

  if (status === 400) {
    return (
      apiMessage ||
      'The request was rejected by Gemini. Check the payload format and selected model.'
    )
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

  return (
    apiMessage ||
    error?.error ||
    'Something went wrong while sending the message. Please try again.'
  )
}

export function toGeminiContents(messages, nextUserText) {
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
