import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_BASE_URL,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json')
      headers.set('x-goog-api-key', import.meta.env.VITE_GEMINI_API_KEY ?? '')
      return headers
    },
  }),
  endpoints: (builder) => ({
    getModels: builder.query({
      query: () => ({
        url: '',
        method: 'GET',
      }),
      transformResponse: (response) =>
        (response?.models ?? [])
          .filter((model) => model?.supportedGenerationMethods?.includes('generateContent'))
          .map((model) => ({
            id: model.name?.replace('models/', '') ?? '',
            label: model.displayName || model.name?.replace('models/', '') || 'Unknown model',
            description: model.description || '',
            inputTokenLimit: model.inputTokenLimit || null,
            outputTokenLimit: model.outputTokenLimit || null,
          }))
          .filter((model) => model.id),
    }),
    sendMessage: builder.mutation({
      query: ({ model, contents }) => ({
        url: `/${model}:generateContent`,
        method: 'POST',
        body: {
          contents,
        },
      }),
      transformResponse: (response) => {
        const parts = response?.candidates?.[0]?.content?.parts ?? []
        const text = parts
          .map((part) => part?.text)
          .filter(Boolean)
          .join('\n')

        return {
          reply: text || 'No response from Gemini.',
          raw: response,
        }
      },
    }),
  }),
})

export const { useGetModelsQuery, useSendMessageMutation } = chatApi
