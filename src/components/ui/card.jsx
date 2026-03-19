import { forwardRef } from 'react'
import { Box } from '@mui/material'

export const Card = forwardRef(function Card({ className = '', ...props }, ref) {
  return <Box ref={ref} className={`shadcn-card ${className}`.trim()} {...props} />
})

export const CardContent = forwardRef(function CardContent(
  { className = '', ...props },
  ref,
) {
  return <Box ref={ref} className={`shadcn-card-content ${className}`.trim()} {...props} />
})
