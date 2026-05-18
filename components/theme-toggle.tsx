'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

const STORAGE_KEY = 'code-formatter:theme'

export function ThemeToggle() {
	const [isDark, setIsDark] = useState(true)
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY)
		const dark = stored ? stored === 'dark' : true
		document.documentElement.classList.toggle('dark', dark)
		setIsDark(dark)
		setMounted(true)
	}, [])

	function toggle() {
		const next = !isDark
		setIsDark(next)
		document.documentElement.classList.toggle('dark', next)
		try {
			localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light')
		} catch {}
	}

	return (
		<button
			type='button'
			onClick={toggle}
			aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
			className='inline-flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors'
		>
			{mounted ? isDark ? <Sun size={14} /> : <Moon size={14} /> : <span className='w-3.5 h-3.5' />}
		</button>
	)
}
