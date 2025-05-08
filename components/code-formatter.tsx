'use client'

import { useState } from 'react'
import { ClipboardCopy, Code, Sparkles, Wind, Cloud, Leaf } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { base16AteliersulphurpoolLight } from 'react-syntax-highlighter/dist/cjs/styles/prism'

export function CodeFormatter() {
	const [input, setInput] = useState('')
	const [formatted, setFormatted] = useState('')
	const [language, setLanguage] = useState<'javascript' | 'typescript'>('typescript')
	const [error, setError] = useState('')
	const [copied, setCopied] = useState(false)
	const [isFormatting, setIsFormatting] = useState(false)

	// Function now calls the API route
	async function formatCode() {
		if (!input.trim()) {
			setFormatted('')
			setError('')
			return
		}

		setIsFormatting(true)
		setError('')
		setFormatted('')

		try {
			const response = await fetch('/api/format', {
				// Call your API route
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					code: input,
					language: language,
				}),
			})

			const result = await response.json() // Always parse JSON to get potential error message

			if (!response.ok) {
				// Use the error message from the API response if available
				throw new Error(result.error || `Request failed with status ${response.status}`)
			}

			// Success - set the formatted code from the API response
			setFormatted(result.formatted)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			console.error('API formatting error:', err)
			setError(`Formatting failed: ${err.message || 'An unknown error occurred'}`)
			setFormatted('') // Ensure output is cleared on error
		} finally {
			setIsFormatting(false)
		}
	}

	function handleCopy() {
		if (!formatted) return
		navigator.clipboard.writeText(formatted)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	// --- The rest of the JSX remains exactly the same ---
	// (No changes needed to the UI structure, state usage in JSX, etc.)
	return (
		<div className='w-full space-y-8'>
			{/* Decorative elements */}
			<div className='absolute top-24 right-12 opacity-10 text-primary animate-float'>
				<Wind size={48} />
			</div>
			<div className='absolute bottom-24 left-12 opacity-10 text-primary animate-float-delayed'>
				<Cloud size={48} />
			</div>
			<div className='absolute top-1/2 left-1/4 opacity-10 text-accent animate-float-slow'>
				<Leaf size={32} />
			</div>

			{/* Input controls */}
			<div className='flex flex-col sm:flex-row justify-between gap-4'>
				<div className='flex items-center gap-6'>
					{/* Language Radio Buttons */}
					<label className='flex items-center gap-2 cursor-pointer group'>
						<input
							type='radio'
							name='language'
							checked={language === 'javascript'}
							onChange={() => setLanguage('javascript')}
							className='accent-primary hidden peer'
						/>
						<div className='flex items-center gap-2 px-5 py-3 bg-secondary/80 text-secondary-foreground peer-checked:bg-primary/90 peer-checked:text-primary-foreground rounded-full shadow-md transition-all duration-300 border border-border/30 backdrop-blur-sm group-hover:shadow-lg'>
							<Code
								size={16}
								className='group-hover:rotate-12 transition-transform'
							/>
							<span className='font-medium'>JavaScript</span>
						</div>
					</label>
					<label className='flex items-center gap-2 cursor-pointer group'>
						<input
							type='radio'
							name='language'
							checked={language === 'typescript'}
							onChange={() => setLanguage('typescript')}
							className='accent-primary hidden peer'
						/>
						<div className='flex items-center gap-2 px-5 py-3 bg-secondary/80 text-secondary-foreground peer-checked:bg-primary/90 peer-checked:text-primary-foreground rounded-full shadow-md transition-all duration-300 border border-border/30 backdrop-blur-sm group-hover:shadow-lg'>
							<Code
								size={16}
								className='group-hover:rotate-12 transition-transform'
							/>
							<span className='font-medium'>TypeScript</span>
						</div>
					</label>
				</div>

				{/* Format Button */}
				<button
					onClick={formatCode}
					disabled={isFormatting || !input.trim()}
					className='flex items-center justify-center gap-2 bg-primary/90 hover:bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium transition-all duration-300
          hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none border border-primary/20 shadow-md'
				>
					<Sparkles
						size={18}
						className={isFormatting ? 'animate-spin' : ''}
					/>
					{isFormatting ? 'Crafting magic...' : 'Format Code'}
				</button>
			</div>

			{/* Input/Output areas */}
			<div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
				{/* Input Area */}
				<div className='flex flex-col border border-border/60 rounded-3xl overflow-hidden bg-card/90 h-[500px] shadow-xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl'>
					<h3 className='m-0 p-5 font-medium text-base border-b border-border/50 bg-gradient-to-r from-secondary/60 to-secondary/20'>
						Input
					</h3>
					<textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder='Paste your code here...'
						className='w-full flex-1 p-6 bg-transparent text-card-foreground font-mono text-sm resize-none focus:outline-none transition-colors duration-300'
						spellCheck='false'
					/>
				</div>

				{/* Output Area */}
				<div className='flex flex-col border border-border/60 rounded-3xl overflow-hidden bg-card/90 h-[500px] shadow-xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl'>
					<div className='flex justify-between items-center border-b border-border/50 bg-gradient-to-r from-secondary/60 to-secondary/20'>
						<h3 className='m-0 p-5 font-medium text-base'>Formatted Output</h3>
						{formatted && !error && (
							<button
								className='mr-5 flex items-center gap-1.5 border border-primary/40 text-primary px-4 py-2 rounded-full text-sm font-medium
                hover:bg-primary/90 hover:text-primary-foreground transition-all duration-300 shadow-sm hover:shadow-md'
								onClick={handleCopy}
							>
								<ClipboardCopy size={14} />
								{copied ? 'Magic copied!' : 'Copy'}
							</button>
						)}
					</div>

					<div className='flex-1 overflow-auto bg-gradient-to-b from-transparent to-secondary/5'>
						{error ? (
							<div className='p-6 text-destructive text-sm h-full whitespace-pre-wrap'>{error}</div>
						) : formatted ? (
							<SyntaxHighlighter
								language={language === 'typescript' ? 'tsx' : 'jsx'}
								style={base16AteliersulphurpoolLight}
								customStyle={{
									margin: 0,
									padding: '24px',
									background: 'transparent',
									height: '100%',
									minHeight: '400px',
									borderRadius: '0 0 1.5rem 1.5rem',
									fontSize: '0.875rem',
								}}
								codeTagProps={{
									style: {
										fontFamily: 'monospace',
									},
								}}
								wrapLines={true}
								wrapLongLines={true}
							>
								{formatted}
							</SyntaxHighlighter>
						) : (
							<div className='flex items-center justify-center h-full text-muted-foreground text-sm p-6'>
								Your formatted code will appear here like magic ✨
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
