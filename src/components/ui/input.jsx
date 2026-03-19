import { forwardRef } from 'react'
import { Box } from '@mui/material'

export const Input = forwardRef(function Input({ className = '', ...props }, ref) {
  return (
    <Box
      ref={ref}
      component="input"
      className={`shadcn-input ${className}`.trim()}
      {...props}
    />
  )
})
