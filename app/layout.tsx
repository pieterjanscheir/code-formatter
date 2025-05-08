import type { Metadata } from 'next'
import { Code, Cloud } from 'lucide-react'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = {
	title: 'Magical Code Formatter',
	description: 'A whimsical tool to format your JavaScript and TypeScript code with a touch of magic',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	const currentYear = new Date().getFullYear()

	return (
		<html
			lang='en'
			suppressHydrationWarning
		>
			<body className='font-sans antialiased'>
				<header className='fixed top-0 left-0 right-0 flex justify-between items-center px-8 py-4 border-b border-border/30 bg-background/70 backdrop-blur-sm z-10'>
					<div className='flex items-center gap-3'>
						<div className='relative'>
							<Code
								className='text-primary'
								size={26}
							/>
						</div>
						<span className='font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-indigo-500 text-transparent bg-clip-text'>
							CodeFormatter
						</span>
					</div>
				</header>
				<div className='pt-20'>{children}</div>
				<footer className='text-center py-8 text-muted-foreground/70 text-sm mt-10 bg-gradient-to-t from-secondary/20 to-transparent border-t border-border/20'>
					<Link
						href='https:/scheir.eu'
						className='hover:underline underline-offset-4'
						target='_blank'
					>
						&copy; {currentYear} scheir.eu (Pieter-Jan Scheir) • Made with love & code
					</Link>
				</footer>
			</body>
		</html>
	)
}
