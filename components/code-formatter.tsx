'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
	ArrowDown,
	Check,
	ChevronDown,
	ClipboardCopy,
	Clock,
	Download,
	Eraser,
	FileText,
	History,
	Loader2,
	Minimize2,
	Play,
	RotateCcw,
	Settings,
	Sparkles,
	Trash2,
	WandSparkles,
} from 'lucide-react'
import { minifyCode } from '../lib/minify'
import { formatCode as runFormat } from '../lib/format'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import {
	oneLight,
	oneDark,
} from 'react-syntax-highlighter/dist/cjs/styles/prism'

type LanguageDef = {
	value: string
	label: string
	highlight: string
	extension: string
}

const LANGUAGES: LanguageDef[] = [
	{ value: 'typescript', label: 'TypeScript', highlight: 'tsx', extension: 'ts' },
	{ value: 'javascript', label: 'JavaScript', highlight: 'jsx', extension: 'js' },
	{ value: 'json', label: 'JSON', highlight: 'json', extension: 'json' },
	{ value: 'css', label: 'CSS', highlight: 'css', extension: 'css' },
	{ value: 'scss', label: 'SCSS', highlight: 'scss', extension: 'scss' },
	{ value: 'less', label: 'Less', highlight: 'less', extension: 'less' },
	{ value: 'html', label: 'HTML', highlight: 'markup', extension: 'html' },
	{ value: 'vue', label: 'Vue', highlight: 'markup', extension: 'vue' },
	{ value: 'markdown', label: 'Markdown', highlight: 'markdown', extension: 'md' },
	{ value: 'yaml', label: 'YAML', highlight: 'yaml', extension: 'yml' },
	{ value: 'graphql', label: 'GraphQL', highlight: 'graphql', extension: 'graphql' },
	{ value: 'python', label: 'Python', highlight: 'python', extension: 'py' },
]

type FormatOptions = {
	printWidth: number
	tabWidth: number
	useTabs: boolean
	semi: boolean
	singleQuote: boolean
	trailingComma: 'none' | 'es5' | 'all'
	arrowParens: 'always' | 'avoid'
	bracketSpacing: boolean
	bracketSameLine: boolean
	proseWrap: 'always' | 'never' | 'preserve'
}

const DEFAULT_OPTIONS: FormatOptions = {
	printWidth: 80,
	tabWidth: 2,
	useTabs: false,
	semi: true,
	singleQuote: true,
	trailingComma: 'all',
	arrowParens: 'always',
	bracketSpacing: true,
	bracketSameLine: false,
	proseWrap: 'preserve',
}

const SAMPLES: Record<string, string> = {
	typescript: `type User={id:number,name:string,roles:Array<'admin'|'user'>}
async function fetchUser(id:number):Promise<User|null>{
const res=await fetch(\`/api/users/\${id}\`);if(!res.ok)return null;
return res.json() as Promise<User>}
const greet=(u:User)=>\`Hello, \${u.name}\`
`,
	javascript: `const users=[{id:1,name:"Ada"},{id:2,name:"Linus"}]
function greet(user){return "Hi "+user.name+"!"}
users.filter(u=>u.id>0).map(u=>greet(u)).forEach(g=>console.log(g))
`,
	json: `{"name":"code-formatter","version":"0.1.0","keywords":["prettier","format","code"],"dependencies":{"react":"^19.0.0","next":"^16.0.0"}}`,
	css: `.btn{background:rebeccapurple;color:white;padding:8px 16px;border-radius:8px}
.btn:hover{background:#5a3a8c;transform:scale(1.02)}
@media (max-width:640px){.btn{width:100%}}`,
	scss: `$primary:#6b21a8;
.btn{background:$primary;color:white;
  &:hover{background:darken($primary,10%)}
  &.lg{padding:12px 24px}}`,
	less: `@primary: #6b21a8;
.btn{background:@primary;color:white;
  &:hover{background:darken(@primary,10%)}}`,
	html: `<!doctype html><html><head><title>Hi</title></head><body><main class="container"><h1>Hello</h1><p class="lead">A code formatter.</p><button>Click</button></main></body></html>`,
	vue: `<template><div class="card"><h2>{{title}}</h2><slot/></div></template>
<script setup lang="ts">const props=defineProps<{title:string}>()</script>
<style scoped>.card{padding:16px;border-radius:12px}</style>`,
	markdown: `#   Hello World
This is **bold** and  this is *italic*.   Inline \`code\` and
- item one
- item two
\`\`\`ts
const x=1
\`\`\`
`,
	yaml: `name: code-formatter
version:    0.1.0
deps:
  - react
  - next
config: {debug: true, retries:    3}`,
	graphql: `query GetUser($id:ID!){user(id:$id){id name email posts{id title createdAt}}}`,
	python: `from typing import List
def greet(name:str)->str:return f"Hello, {name}"



class User:
    def __init__(self,id:int,name:str):
        self.id=id
        self.name=name


    def display(self)->str:
        return f"{self.id}: {self.name}"
def main(users:List[User])->None:
    for u in users:print(u.display())
`,
}

const STORAGE_KEY = 'code-formatter:v1'
const HISTORY_KEY = 'code-formatter:history'
const HISTORY_LIMIT = 3

function timeAgo(ms: number): string {
	const diff = Date.now() - ms
	if (diff < 60_000) return 'just now'
	if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
	if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
	if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`
	return new Date(ms).toLocaleDateString()
}

type Persisted = {
	language?: string
	options?: Partial<FormatOptions>
	input?: string
}

type HistoryEntry = {
	input: string
	output: string
	language: string
	ts: number
}

export function CodeFormatter() {
	const [input, setInput] = useState('')
	const [formatted, setFormatted] = useState('')
	const [language, setLanguage] = useState<string>('typescript')
	const [options, setOptions] = useState<FormatOptions>(DEFAULT_OPTIONS)
	const [error, setError] = useState('')
	const [copied, setCopied] = useState(false)
	const [isFormatting, setIsFormatting] = useState(false)
	const [showSettings, setShowSettings] = useState(false)
	const [minified, setMinified] = useState(false)
	const [isDark, setIsDark] = useState(true)
	const [hydrated, setHydrated] = useState(false)
	const [history, setHistory] = useState<HistoryEntry[]>([])
	const [showHistory, setShowHistory] = useState(false)
	const settingsRef = useRef<HTMLDivElement | null>(null)
	const inputRef = useRef<HTMLTextAreaElement | null>(null)
	const outputRef = useRef<HTMLDivElement | null>(null)

	const currentLang = useMemo(
		() => LANGUAGES.find((l) => l.value === language) ?? LANGUAGES[0],
		[language],
	)

	useEffect(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY)
			if (raw) {
				const data = JSON.parse(raw) as Persisted
				if (data.language && LANGUAGES.some((l) => l.value === data.language)) {
					setLanguage(data.language)
				}
				if (data.options) {
					setOptions({ ...DEFAULT_OPTIONS, ...data.options })
				}
				if (typeof data.input === 'string') {
					setInput(data.input)
				}
			}
		} catch {}
		try {
			const rawHist = localStorage.getItem(HISTORY_KEY)
			if (rawHist) {
				const parsed = JSON.parse(rawHist)
				if (Array.isArray(parsed)) {
					const cleaned = parsed
						.filter(
							(h): h is HistoryEntry =>
								h &&
								typeof h.input === 'string' &&
								typeof h.output === 'string' &&
								typeof h.language === 'string' &&
								typeof h.ts === 'number',
						)
						.slice(0, HISTORY_LIMIT)
					setHistory(cleaned)
				}
			}
		} catch {}
		setIsDark(document.documentElement.classList.contains('dark'))
		setHydrated(true)
	}, [])

	useEffect(() => {
		if (!hydrated) return
		try {
			const payload: Persisted = { language, options, input }
			localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
		} catch {}
	}, [language, options, input, hydrated])

	useEffect(() => {
		const observer = new MutationObserver(() => {
			setIsDark(document.documentElement.classList.contains('dark'))
		})
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
		return () => observer.disconnect()
	}, [])

	const formatCode = useCallback(async () => {
		if (!input.trim()) {
			setFormatted('')
			setError('')
			return
		}
		setIsFormatting(true)
		setError('')
		try {
			const output = await runFormat(input, language, options)
			setFormatted(output)
			setMinified(false)
			setHistory((prev) => {
				const head = prev[0]
				if (head && head.input === input && head.output === output && head.language === language) {
					return prev
				}
				const entry: HistoryEntry = { input, output, language, ts: Date.now() }
				const next = [entry, ...prev].slice(0, HISTORY_LIMIT)
				try {
					localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
				} catch {}
				return next
			})
			requestAnimationFrame(() => {
				outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
			})
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An unknown error occurred')
			setFormatted('')
		} finally {
			setIsFormatting(false)
		}
	}, [input, language, options])

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
				e.preventDefault()
				formatCode()
			}
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [formatCode])

	useEffect(() => {
		if (!showSettings) return
		function onClick(e: MouseEvent) {
			if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
				setShowSettings(false)
			}
		}
		function onEsc(e: KeyboardEvent) {
			if (e.key === 'Escape') setShowSettings(false)
		}
		document.addEventListener('mousedown', onClick)
		document.addEventListener('keydown', onEsc)
		return () => {
			document.removeEventListener('mousedown', onClick)
			document.removeEventListener('keydown', onEsc)
		}
	}, [showSettings])

	function handleTextareaKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === 'Tab' && !e.shiftKey) {
			e.preventDefault()
			const el = e.currentTarget
			const start = el.selectionStart
			const end = el.selectionEnd
			const indent = options.useTabs ? '\t' : ' '.repeat(options.tabWidth)
			const next = input.substring(0, start) + indent + input.substring(end)
			setInput(next)
			requestAnimationFrame(() => {
				el.selectionStart = el.selectionEnd = start + indent.length
			})
		}
	}

	const displayed = useMemo(
		() => (minified && formatted ? minifyCode(formatted, language) : formatted),
		[minified, formatted, language],
	)

	function handleCopy() {
		if (!displayed) return
		navigator.clipboard.writeText(displayed)
		setCopied(true)
		setTimeout(() => setCopied(false), 1500)
	}

	function handleDownload() {
		if (!displayed) return
		const blob = new Blob([displayed], { type: 'text/plain;charset=utf-8' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `formatted.${currentLang.extension}`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
	}

	function clearOutput() {
		setFormatted('')
		setError('')
		setMinified(false)
	}

	function handleLanguageChange(next: string) {
		if (next === language) return
		setLanguage(next)
		setInput('')
		clearOutput()
	}

	function handleInputChange(value: string) {
		setInput(value)
		if (formatted || error) clearOutput()
	}

	function restoreEntry(entry: HistoryEntry) {
		setLanguage(entry.language)
		setInput(entry.input)
		setFormatted(entry.output)
		setError('')
		setMinified(false)
		setShowHistory(false)
		requestAnimationFrame(() => {
			outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
		})
	}

	function clearHistory() {
		setHistory([])
		setShowHistory(false)
		try {
			localStorage.removeItem(HISTORY_KEY)
		} catch {}
	}

	function loadSample() {
		const sample = SAMPLES[language] ?? ''
		setInput(sample)
		setFormatted('')
		setError('')
		inputRef.current?.focus()
	}

	function clearAll() {
		setInput('')
		setFormatted('')
		setError('')
		inputRef.current?.focus()
	}

	const inputStats = useMemo(() => {
		if (!input) return { lines: 0, chars: 0 }
		return { lines: input.split('\n').length, chars: input.length }
	}, [input])

	const outputStats = useMemo(() => {
		if (!displayed) return { lines: 0, chars: 0 }
		return { lines: displayed.split('\n').length, chars: displayed.length }
	}, [displayed])

	const savings = useMemo(() => {
		if (!minified || !formatted) return null
		const after = displayed.length
		const beforeFormatted = formatted.length
		const beforeInput = input.length
		if (beforeFormatted === 0) return null
		const vsFormatted = Math.round(((beforeFormatted - after) / beforeFormatted) * 100)
		const vsInput = beforeInput > 0 ? Math.round(((beforeInput - after) / beforeInput) * 100) : null
		return { vsFormatted, vsInput, after }
	}, [minified, formatted, displayed, input])

	const shortcutHint = useMemo(() => {
		if (typeof navigator === 'undefined') return 'Ctrl+Enter'
		return /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? '⌘ Enter' : 'Ctrl+Enter'
	}, [])

	return (
		<div className='w-full flex flex-col gap-4'>
			{/* Toolbar */}
			<div className='relative z-30 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2'>
				<div className='relative'>
					<select
						value={language}
						onChange={(e) => handleLanguageChange(e.target.value)}
						className='appearance-none pl-2.5 pr-7 h-8 rounded-md bg-transparent border border-border hover:border-foreground/20 text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring transition-colors'
					>
						{LANGUAGES.map((l) => (
							<option
								key={l.value}
								value={l.value}
							>
								{l.label}
							</option>
						))}
					</select>
					<svg
						className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground'
						width='10'
						height='10'
						viewBox='0 0 12 12'
						fill='none'
						aria-hidden
					>
						<path
							d='M2 4l4 4 4-4'
							stroke='currentColor'
							strokeWidth='1.5'
							strokeLinecap='round'
							strokeLinejoin='round'
						/>
					</svg>
				</div>

				<div
					ref={settingsRef}
					className='relative'
				>
					<button
						type='button'
						onClick={() => setShowSettings((s) => !s)}
						aria-expanded={showSettings}
						aria-haspopup='dialog'
						className={`flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm border transition-colors ${
							showSettings
								? 'bg-secondary border-border text-foreground'
								: 'border-border hover:border-foreground/20 text-foreground/90 hover:bg-secondary/60'
						}`}
					>
						<Settings size={13} />
						Options
					</button>
					{showSettings && (
						<SettingsPanel
							options={options}
							onChange={setOptions}
							onReset={() => setOptions(DEFAULT_OPTIONS)}
						/>
					)}
				</div>

				<button
					type='button'
					onClick={loadSample}
					className='flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm border border-border hover:border-foreground/20 hover:bg-secondary/60 transition-colors'
				>
					<Sparkles size={13} />
					Sample
				</button>

				<button
					type='button'
					onClick={clearAll}
					disabled={!input && !formatted}
					className='flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent'
				>
					<Eraser size={13} />
					Clear
				</button>

				<div className='ml-auto flex items-center gap-2'>
					<kbd className='hidden sm:inline-flex items-center h-6 px-1.5 rounded text-[10px] font-mono text-muted-foreground bg-secondary/60 border border-border'>
						{shortcutHint}
					</kbd>
					<button
						onClick={formatCode}
						disabled={isFormatting || !input.trim()}
						className='flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all'
					>
						<span className='inline-flex items-center justify-center w-3 h-3'>
							{isFormatting ? (
								<Loader2
									size={12}
									className='animate-spin'
								/>
							) : (
								<Play
									size={12}
									fill='currentColor'
								/>
							)}
						</span>
						Format
					</button>
				</div>
			</div>

			{/* Input */}
			<section className='relative z-0 flex flex-col rounded-lg border border-border bg-card overflow-hidden'>
				<div className='flex items-center justify-between px-3.5 py-2 border-b border-border bg-secondary/30'>
					<div className='flex items-center gap-2'>
						<FileText
							size={12}
							className='text-muted-foreground'
						/>
						<span className='text-xs font-medium'>Input</span>
						<span className='text-xs text-muted-foreground tabular-nums'>
							{inputStats.lines} L · {inputStats.chars} ch
						</span>
					</div>
					<span className='text-[10px] uppercase tracking-wider text-muted-foreground'>
						{currentLang.label}
					</span>
				</div>
				<textarea
					ref={inputRef}
					value={input}
					onChange={(e) => handleInputChange(e.target.value)}
					onKeyDown={handleTextareaKey}
					placeholder={`Paste your ${currentLang.label} here…`}
					className='w-full h-[360px] p-4 bg-transparent text-card-foreground font-mono text-[13px] leading-[1.65] resize-none focus:outline-none scrollbar-thin placeholder:text-muted-foreground/60'
					spellCheck='false'
					autoCorrect='off'
					autoCapitalize='off'
				/>
			</section>

			{/* Divider with arrow */}
			<div className='flex justify-center -my-1 pointer-events-none'>
				<div className='inline-flex items-center justify-center w-7 h-7 rounded-full border border-border bg-card text-muted-foreground'>
					{isFormatting ? <Loader2 size={12} className='animate-spin' /> : <ArrowDown size={12} />}
				</div>
			</div>

			{/* Output */}
			<section
				ref={outputRef}
				className='relative z-0 flex flex-col rounded-lg border border-border bg-card overflow-hidden'
			>
				<div className='flex items-center justify-between px-3.5 py-2 border-b border-border bg-secondary/30'>
					<div className='flex items-center gap-2'>
						<FileText
							size={12}
							className='text-muted-foreground'
						/>
						<span className='text-xs font-medium'>Output</span>
						{formatted && !error && (
							<span className='text-xs text-muted-foreground tabular-nums'>
								{outputStats.lines} L · {outputStats.chars} ch
							</span>
						)}
						{savings && (
							<span className='flex items-center gap-1 tabular-nums'>
								<span
									className='text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/15 text-primary'
									title='Reduction vs. formatted output'
								>
									−{Math.max(0, savings.vsFormatted)}% min
								</span>
								{savings.vsInput !== null && (
									<span
										className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
											savings.vsInput >= 0
												? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400'
												: 'bg-amber-500/15 text-amber-500 dark:text-amber-400'
										}`}
										title='Compared to your original input'
									>
										{savings.vsInput >= 0 ? '−' : '+'}
										{Math.abs(savings.vsInput)}% vs input
									</span>
								)}
							</span>
						)}
					</div>
					<div className='flex items-center gap-1'>
						{formatted && !error && (
							<>
								<button
									type='button'
									onClick={() => setMinified((m) => !m)}
									title={minified ? 'Show formatted' : 'Minify for AI / token savings'}
									className={`flex items-center gap-1 text-xs px-2 h-7 rounded-md transition-colors ${
										minified
											? 'bg-primary/15 text-primary hover:bg-primary/20'
											: 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
									}`}
								>
									<Minimize2 size={12} />
									<span className='hidden sm:inline'>{minified ? 'Minified' : 'Minify'}</span>
								</button>
								<button
									type='button'
									className='flex items-center gap-1 text-xs px-2 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors'
									onClick={handleDownload}
									title='Download'
								>
									<Download size={12} />
									<span className='hidden sm:inline'>Download</span>
								</button>
								<button
									type='button'
									className='flex items-center gap-1 text-xs px-2 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors'
									onClick={handleCopy}
									title='Copy'
								>
									{copied ? (
										<Check
											size={12}
											className='text-primary'
										/>
									) : (
										<ClipboardCopy size={12} />
									)}
									<span className='hidden sm:inline'>{copied ? 'Copied' : 'Copy'}</span>
								</button>
							</>
						)}
					</div>
				</div>

				<div className='h-[360px] overflow-auto scrollbar-thin'>
					{error ? (
						<pre className='p-4 text-destructive text-[13px] whitespace-pre-wrap font-mono leading-[1.65]'>
							{error}
						</pre>
					) : formatted ? (
						<SyntaxHighlighter
							language={currentLang.highlight}
							style={isDark ? oneDark : oneLight}
							customStyle={{
								margin: 0,
								padding: '16px',
								background: 'transparent',
								minHeight: '100%',
								fontSize: '13px',
								lineHeight: '1.65',
							}}
							codeTagProps={{
								style: { fontFamily: 'var(--font-mono, ui-monospace, monospace)' },
							}}
							showLineNumbers={!minified}
							lineNumberStyle={{
								minWidth: '2.25em',
								paddingRight: '1em',
								color: 'var(--color-muted-foreground)',
								opacity: 0.45,
								userSelect: 'none',
							}}
							wrapLongLines
						>
							{displayed}
						</SyntaxHighlighter>
					) : isFormatting ? (
						<div className='h-full flex items-center justify-center gap-2 text-sm text-muted-foreground'>
							<Loader2
								size={14}
								className='animate-spin'
							/>
							Formatting…
						</div>
					) : (
						<div className='h-full flex flex-col items-center justify-center text-center px-6 gap-3'>
							<div className='inline-flex items-center justify-center w-10 h-10 rounded-lg bg-secondary/60 text-muted-foreground'>
								<WandSparkles size={18} />
							</div>
							<div className='space-y-1'>
								<p className='text-sm font-medium text-foreground/90'>Nothing to show yet</p>
								<p className='text-xs text-muted-foreground'>
									{input.trim()
										? 'Press the button below to format your code.'
										: `Paste some ${currentLang.label} above to get started.`}
								</p>
							</div>
							<div className='flex items-center gap-2 pt-1'>
								<button
									type='button'
									onClick={formatCode}
									disabled={!input.trim()}
									className='inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all'
								>
									<Play
										size={11}
										fill='currentColor'
									/>
									Format
								</button>
								<span className='text-[10px] text-muted-foreground'>or</span>
								<kbd className='inline-flex items-center h-6 px-1.5 rounded text-[10px] font-mono text-muted-foreground bg-secondary/60 border border-border'>
									{shortcutHint}
								</kbd>
							</div>
						</div>
					)}
				</div>
			</section>

			{/* History — subtle, collapsed by default */}
			{history.length > 0 && (
				<div className='mt-2'>
					<button
						type='button'
						onClick={() => setShowHistory((s) => !s)}
						aria-expanded={showHistory}
						className='inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors'
					>
						<History size={11} />
						Recent
						<span className='tabular-nums'>({history.length})</span>
						<ChevronDown
							size={11}
							className={`transition-transform ${showHistory ? 'rotate-180' : ''}`}
						/>
					</button>

					{showHistory && (
						<div className='mt-2 rounded-lg border border-border bg-card divide-y divide-border'>
							{history.map((h) => (
								<div
									key={h.ts}
									className='flex items-start gap-3 px-3 py-2'
								>
									<div className='flex-1 min-w-0'>
										<div className='flex items-center gap-2 text-[10px] text-muted-foreground'>
											<Clock size={9} />
											<span>{timeAgo(h.ts)}</span>
											<span className='uppercase tracking-wider'>
												{LANGUAGES.find((l) => l.value === h.language)?.label ?? h.language}
											</span>
										</div>
										<pre className='mt-1 text-[11px] font-mono text-foreground/70 whitespace-pre overflow-hidden line-clamp-1 leading-snug'>
											{h.input.split('\n').find((l) => l.trim()) ?? '—'}
										</pre>
									</div>
									<button
										type='button'
										onClick={() => restoreEntry(h)}
										className='shrink-0 flex items-center gap-1 text-[11px] px-2 h-6 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors'
										title='Restore'
									>
										<RotateCcw size={10} />
										Restore
									</button>
								</div>
							))}
							<div className='flex justify-end px-3 py-1.5'>
								<button
									type='button'
									onClick={clearHistory}
									className='inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors'
								>
									<Trash2 size={10} />
									Clear
								</button>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	)
}

type SettingsPanelProps = {
	options: FormatOptions
	onChange: (next: FormatOptions) => void
	onReset: () => void
}

function SettingsPanel({ options, onChange, onReset }: SettingsPanelProps) {
	function set<K extends keyof FormatOptions>(key: K, value: FormatOptions[K]) {
		onChange({ ...options, [key]: value })
	}

	return (
		<div
			role='dialog'
			aria-label='Formatting options'
			className='absolute z-50 left-0 top-[calc(100%+6px)] w-[min(92vw,340px)] rounded-lg border border-border bg-popover text-popover-foreground shadow-xl p-3 space-y-3'
		>
			<div className='flex items-center justify-between'>
				<h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
					Options
				</h4>
				<button
					type='button'
					onClick={onReset}
					className='flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors'
					title='Reset to defaults'
				>
					<RotateCcw size={10} />
					Reset
				</button>
			</div>

			<div className='grid grid-cols-2 gap-2'>
				<NumberField
					label='Print width'
					value={options.printWidth}
					min={20}
					max={400}
					onChange={(v) => set('printWidth', v)}
				/>
				<NumberField
					label='Tab width'
					value={options.tabWidth}
					min={1}
					max={12}
					onChange={(v) => set('tabWidth', v)}
				/>
			</div>

			<div className='grid grid-cols-2 gap-2'>
				<SelectField
					label='Trailing comma'
					value={options.trailingComma}
					onChange={(v) => set('trailingComma', v as FormatOptions['trailingComma'])}
					options={[
						{ value: 'none', label: 'None' },
						{ value: 'es5', label: 'ES5' },
						{ value: 'all', label: 'All' },
					]}
				/>
				<SelectField
					label='Arrow parens'
					value={options.arrowParens}
					onChange={(v) => set('arrowParens', v as FormatOptions['arrowParens'])}
					options={[
						{ value: 'always', label: 'Always' },
						{ value: 'avoid', label: 'Avoid' },
					]}
				/>
			</div>

			<SelectField
				label='Prose wrap'
				value={options.proseWrap}
				onChange={(v) => set('proseWrap', v as FormatOptions['proseWrap'])}
				options={[
					{ value: 'preserve', label: 'Preserve' },
					{ value: 'always', label: 'Always' },
					{ value: 'never', label: 'Never' },
				]}
			/>

			<div className='border-t border-border pt-2 space-y-1'>
				<ToggleField
					label='Use tabs'
					checked={options.useTabs}
					onChange={(v) => set('useTabs', v)}
				/>
				<ToggleField
					label='Semicolons'
					checked={options.semi}
					onChange={(v) => set('semi', v)}
				/>
				<ToggleField
					label='Single quotes'
					checked={options.singleQuote}
					onChange={(v) => set('singleQuote', v)}
				/>
				<ToggleField
					label='Bracket spacing'
					checked={options.bracketSpacing}
					onChange={(v) => set('bracketSpacing', v)}
				/>
				<ToggleField
					label='Bracket same line'
					checked={options.bracketSameLine}
					onChange={(v) => set('bracketSameLine', v)}
				/>
			</div>
		</div>
	)
}

function NumberField({
	label,
	value,
	min,
	max,
	onChange,
}: {
	label: string
	value: number
	min: number
	max: number
	onChange: (v: number) => void
}) {
	return (
		<label className='flex flex-col gap-1'>
			<span className='text-[11px] text-muted-foreground'>{label}</span>
			<input
				type='number'
				value={value}
				min={min}
				max={max}
				onChange={(e) => {
					const n = Number(e.target.value)
					if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)))
				}}
				className='h-7 px-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring'
			/>
		</label>
	)
}

function SelectField({
	label,
	value,
	onChange,
	options,
}: {
	label: string
	value: string
	onChange: (v: string) => void
	options: { value: string; label: string }[]
}) {
	return (
		<label className='flex flex-col gap-1'>
			<span className='text-[11px] text-muted-foreground'>{label}</span>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className='h-7 px-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring'
			>
				{options.map((o) => (
					<option
						key={o.value}
						value={o.value}
					>
						{o.label}
					</option>
				))}
			</select>
		</label>
	)
}

function ToggleField({
	label,
	checked,
	onChange,
}: {
	label: string
	checked: boolean
	onChange: (v: boolean) => void
}) {
	return (
		<button
			type='button'
			onClick={() => onChange(!checked)}
			role='switch'
			aria-checked={checked}
			className='w-full flex items-center justify-between py-1 text-xs hover:text-foreground transition-colors group'
		>
			<span className='text-foreground/90'>{label}</span>
			<span
				className={`relative inline-flex h-[14px] w-[24px] shrink-0 items-center rounded-full transition-colors ${
					checked ? 'bg-primary' : 'bg-secondary border border-border'
				}`}
			>
				<span
					className={`inline-block h-[10px] w-[10px] rounded-full bg-white shadow-sm transform transition-transform ${
						checked ? 'translate-x-[12px]' : 'translate-x-[1px]'
					}`}
				/>
			</span>
		</button>
	)
}
