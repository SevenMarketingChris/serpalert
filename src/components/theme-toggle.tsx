'use client'
import { useTheme } from './theme-provider'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative w-[52px] h-7 rounded-full border transition-all duration-200 shrink-0"
      style={{
        background: isDark ? '#2A2A2A' : '#E8E8EC',
        borderColor: isDark ? '#3D3D3D' : '#CACACE',
      }}
    >
      {/* Sun */}
      <svg
        className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-opacity"
        style={{ opacity: isDark ? 0.3 : 0.6, color: '#FF9F0A' }}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      >
        <circle cx="12" cy="12" r="4" />
        <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
      {/* Moon */}
      <svg
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 transition-opacity"
        style={{ opacity: isDark ? 0.8 : 0.25, color: '#AEAEB2' }}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </svg>
      {/* Thumb */}
      <span
        className="absolute top-0.5 w-[22px] h-[22px] rounded-full transition-all duration-200"
        style={{
          left: isDark ? 'calc(100% - 1.5rem)' : '2px',
          background: isDark ? '#636360' : '#FFFFFF',
          boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.15)',
        }}
      />
    </button>
  )
}
