import React from 'react'

type Props = { children: React.ReactNode }

const SignUpLayout = ({ children }: Props) => {
  return (
    <div className="flex h-full items-center justify-center">{children}</div>
  )
}

export default SignUpLayout
