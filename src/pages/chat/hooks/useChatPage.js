import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useGetModelsQuery } from '../../../redux/api/chatApi'
import {
  selectBotTyping,
  selectLastError,
  selectMessages,
} from '../../../redux/selectors/chatSelectors'
import {
  addBotMessage,
  addUserMessage,
  markMessageError,
  resetChat,
  setBotTyping,
  setLastError,
} from '../../../redux/slices/chatSlice'
import { createAppTheme } from '../../../theme/createAppTheme'
import { getFriendlyErrorMessage } from '../utils/chatHelpers'
import { streamChatReply } from '../utils/streaming'

const themeStorageKey = 'chat-theme'

export function useChatPage() {
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [streamingText, setStreamingText] = useState('')
  const [streamTargetText, setStreamTargetText] = useState('')
  const [mode, setMode] = useState(
    () => window.localStorage.getItem(themeStorageKey) ?? 'light',
  )
  const dispatch = useDispatch()
  const messages = useSelector(selectMessages)
  const isTyping = useSelector(selectBotTyping)
  const lastError = useSelector(selectLastError)
  const messagesScrollRef = useRef(null)
  const inputRef = useRef(null)
  const streamingTextRef = useRef('')
  const {
    data: availableModels = [],
    error: modelsError,
    isLoading: isModelsLoading,
  } = useGetModelsQuery()
  const theme = useMemo(() => createAppTheme(mode), [mode])

  useEffect(() => {
    if (!selectedModel && availableModels.length > 0) {
      setSelectedModel(availableModels[0].id)
    }
  }, [availableModels, selectedModel])

  useEffect(() => {
    streamingTextRef.current = streamingText
  }, [streamingText])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (isTyping) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [isTyping])

  useEffect(() => {
    window.localStorage.setItem(themeStorageKey, mode)
  }, [mode])

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const scrollContainer = messagesScrollRef.current

      if (!scrollContainer) {
        return
      }

      scrollContainer.scrollTop = scrollContainer.scrollHeight
    })

    return () => window.cancelAnimationFrame(frameId)
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
      const step =
        remaining > 240 ? 20 : remaining > 120 ? 12 : remaining > 40 ? 8 : 4
      const nextLength = Math.min(
        streamTargetText.length,
        streamingText.length + step,
      )
      setStreamingText(streamTargetText.slice(0, nextLength))
    }, 10)

    return () => window.clearTimeout(timeoutId)
  }, [isTyping, streamTargetText, streamingText])

  const isStreaming = isTyping && Boolean(streamingText)
  const modelsErrorMessage = modelsError
    ? getFriendlyErrorMessage(modelsError)
    : ''

  const waitForStreamAnimation = (targetText) =>
    new Promise((resolve) => {
      if (!targetText || typeof window === 'undefined') {
        resolve()
        return
      }

      const startedAt = window.performance.now()
      const maxWaitMs = Math.max(2500, targetText.length * 18)

      const checkAnimation = () => {
        if (streamingTextRef.current.length >= targetText.length) {
          resolve()
          return
        }

        if (window.performance.now() - startedAt >= maxWaitMs) {
          resolve()
          return
        }

        window.requestAnimationFrame(checkAnimation)
      }

      checkAnimation()
    })

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
      }),
    )
    setInput('')
    window.requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
    dispatch(setBotTyping(true))
    setStreamingText('')
    setStreamTargetText('')

    try {
      const { reply, textUpdateCount } = await streamChatReply({
        model: selectedModel,
        messages,
        nextUserText: trimmed,
        onText: setStreamTargetText,
      })
      const finalReply = reply || 'No response from Gemini.'
      const shouldPlayBufferedFallback =
        Boolean(finalReply) && streamingTextRef.current.length === 0

      if (shouldPlayBufferedFallback || textUpdateCount === 0) {
        setStreamTargetText(finalReply)
        await waitForStreamAnimation(finalReply)
      }

      dispatch(
        addBotMessage({
          id: Date.now() + 1,
          role: 'bot',
          text: finalReply,
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
          status: 'error',
        }),
      )
    } finally {
      dispatch(setBotTyping(false))
    }
  }

  return {
    availableModels,
    handleResetChat: () => dispatch(resetChat()),
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
  }
}
