"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

const COLOR_THEME_STORAGE_KEY = "quant-color-theme"

export const colorThemeOptions = [
  { value: "neutral", label: "Neutral", description: "Crisp monochrome" },
  { value: "stone", label: "Stone", description: "Warm editorial neutrals" },
  { value: "zinc", label: "Zinc", description: "Soft grayscale" },
  { value: "gray", label: "Gray", description: "Cool corporate" },
  { value: "slate", label: "Slate", description: "Midnight blue slate" },
  { value: "rose", label: "Rose", description: "Vibrant rose gradients" },
  { value: "violet", label: "Violet", description: "Purple studio hues" },
  { value: "emerald", label: "Emerald", description: "Green trading floor" },
  { value: "blue", label: "Blue", description: "Calm research blues" },
  { value: "amber", label: "Amber", description: "Warm product tones" },
] as const

export type ColorTheme = (typeof colorThemeOptions)[number]["value"]

type ColorThemeContextValue = {
  colorTheme: ColorTheme
  setColorTheme: (theme: ColorTheme) => void
}

const ColorThemeContext = createContext<ColorThemeContextValue | undefined>(
  undefined
)

function isColorTheme(value: unknown): value is ColorTheme {
  return colorThemeOptions.some((option) => option.value === value)
}

export function ColorThemeProvider({ children }: { children: ReactNode }) {
  const [colorTheme, setColorTheme] = useState<ColorTheme>("neutral")

  useEffect(() => {
    const stored = window.localStorage.getItem(COLOR_THEME_STORAGE_KEY)
    if (stored && isColorTheme(stored)) {
      setColorTheme(stored)
      document.documentElement.dataset.colorTheme = stored
    } else {
      document.documentElement.dataset.colorTheme = "neutral"
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.colorTheme = colorTheme
    window.localStorage.setItem(COLOR_THEME_STORAGE_KEY, colorTheme)
  }, [colorTheme])

  const value = useMemo(
    () => ({
      colorTheme,
      setColorTheme,
    }),
    [colorTheme]
  )

  return (
    <ColorThemeContext.Provider value={value}>
      {children}
    </ColorThemeContext.Provider>
  )
}

export function useColorTheme() {
  const context = useContext(ColorThemeContext)
  if (!context) {
    throw new Error(
      "useColorTheme must be used within a ColorThemeProvider"
    )
  }

  return context
}
