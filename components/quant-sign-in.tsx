"use client"

import type { ComponentProps } from "react"

import { SignIn } from "@clerk/nextjs"

type QuantSignInProps = ComponentProps<typeof SignIn>

export function QuantSignIn(props: QuantSignInProps) {
  return (
    <SignIn {...props} />
  )
}
