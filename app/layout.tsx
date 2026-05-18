import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import Link from 'next/link'
import './globals.css'
import { ThemeToggle } from '../components/theme-toggle'

export const metadata: Metadata = {
	title: 'CodeFormatter',
	description: 'Format JavaScript, TypeScript, JSON, CSS, HTML, Markdown and more with Prettier.',
}

const themeInitScript = `(function(){try{var s=localStorage.getItem('code-formatter:theme');var d=s?s==='dark':true;if(d)document.documentElement.classList.add('dark');}catch(e){document.documentElement.classList.add('dark');}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html
			lang='en'
			suppressHydrationWarning
			className={`${GeistSans.variable} ${GeistMono.variable}`}
		>
			<head>
				<script
					dangerouslySetInnerHTML={{ __html: themeInitScript }}
				/>
			</head>
			<body className='font-sans antialiased min-h-screen flex flex-col'>
				<header className='sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md'>
					<div className='mx-auto max-w-6xl px-5 sm:px-6 h-12 flex items-center justify-between'>
						<Link
							href='/'
							className='flex items-center gap-2 group'
						>
							<span className='inline-flex items-center justify-center w-6 h-6 rounded-md bg-primary/15 text-primary'>
								<svg
									viewBox='0 0 24 24'
									fill='none'
									className='w-3.5 h-3.5'
									aria-hidden
								>
									<path
										d='M8 6l-5 6 5 6M16 6l5 6-5 6'
										stroke='currentColor'
										strokeWidth='2'
										strokeLinecap='round'
										strokeLinejoin='round'
									/>
								</svg>
							</span>
							<span className='text-sm font-medium tracking-tight'>CodeFormatter</span>
						</Link>
						<div className='flex items-center gap-1'>
							<Link
								href='/about'
								className='px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors'
							>
								About
							</Link>
							<ThemeToggle />
						</div>
					</div>
				</header>
				<div className='flex-1'>{children}</div>
				<footer className='border-t border-border'>
					<div className='mx-auto max-w-6xl px-5 sm:px-6 h-12 flex items-center justify-between text-xs text-muted-foreground'>
						<span>CodeFormatter</span>
						<Link
							href='https://scheir.eu'
							target='_blank'
							className='hover:text-foreground transition-colors'
						>
							scheir.eu
						</Link>
					</div>
				</footer>
			</body>
		</html>
	)
}
