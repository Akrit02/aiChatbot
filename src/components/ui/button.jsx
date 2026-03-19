import { forwardRef } from 'react'
import { Box } from '@mui/material'

export const Button = forwardRef(function Button(
  { className = '', type = 'button', children, ...props },
  ref,
) {
  return (
    <Box
      ref={ref}
      component="button"
      type={type}
      className={`shadcn-button ${className}`.trim()}
      {...props}
    >
      {children}
    </Box>
  )
})
