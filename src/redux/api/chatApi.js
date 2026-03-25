import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { GEMINI_API_KEY, GEMINI_BASE_URL } from '../../config/gemini'

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: fetchBaseQuery({
    baseUrl: GEMINI_BASE_URL,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json')
      headers.set('x-goog-api-key', GEMINI_API_KEY)
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
          .filter((model) =>
            model?.supportedGenerationMethods?.includes('generateContent'),
          )
          .map((model) => ({
            id: model.name?.replace('models/', '') ?? '',
            label:
              model.displayName ||
              model.name?.replace('models/', '') ||
              'Unknown model',
            description: model.description || '',
            inputTokenLimit: model.inputTokenLimit || null,
            outputTokenLimit: model.outputTokenLimit || null,
          }))
          .filter((model) => model.id),
    }),
  }),
})

export const { useGetModelsQuery } = chatApi
