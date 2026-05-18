import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
	title: 'About — CodeFormatter',
	description: 'About this code formatter and its privacy guarantees.',
}

export default function AboutPage() {
	return (
		<main className='mx-auto max-w-2xl px-5 sm:px-6 py-10 sm:py-14'>
			<Link
				href='/'
				className='inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6'
			>
				<ArrowLeft size={12} />
				Back
			</Link>

			<h1 className='text-2xl font-semibold tracking-tight'>About</h1>
			<p className='mt-2 text-sm text-muted-foreground'>
				A minimal, fast, in-browser code formatter.
			</p>

			<section className='mt-8 space-y-3'>
				<h2 className='text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'>
					What it does
				</h2>
				<p className='text-sm text-foreground/90 leading-relaxed'>
					Formats JavaScript, TypeScript, JSON, CSS, SCSS, Less, HTML, Vue, Markdown, YAML, GraphQL and Python.
					JavaScript/TypeScript/JSX/TSX are formatted with{' '}
					<Link
						href='https://prettier.io'
						target='_blank'
						className='text-primary hover:underline underline-offset-2'
					>
						Prettier
					</Link>
					. Python uses a small built-in normaliser (indent, blank lines, trailing whitespace) — it is not a full
					PEP-8 formatter.
				</p>
				<p className='text-sm text-foreground/90 leading-relaxed'>
					You can also minify formatted output to save tokens when pasting into an AI assistant — the savings
					compared to your original input are shown alongside.
				</p>
			</section>

			<section className='mt-8 space-y-3'>
				<h2 className='text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'>
					Privacy
				</h2>
				<p className='text-sm text-foreground/90 leading-relaxed'>
					<strong className='font-semibold'>All formatting happens in your browser.</strong> Your code is never
					sent to a server run by the developer. Prettier and the Python formatter run entirely client-side via
					WebAssembly / JavaScript bundles.
				</p>
				<p className='text-sm text-foreground/90 leading-relaxed'>
					The only data this app persists is on your own device, in <code className='font-mono text-xs px-1 py-0.5 rounded bg-secondary'>localStorage</code>:
				</p>
				<ul className='ml-5 list-disc text-sm text-foreground/90 space-y-1'>
					<li>your selected language</li>
					<li>your formatting options</li>
					<li>your current input draft</li>
					<li>your last 3 formatting runs (input + output)</li>
					<li>your theme preference (light/dark)</li>
				</ul>
				<p className='text-sm text-foreground/90 leading-relaxed'>
					Clearing your browser data removes everything. There is no analytics, no telemetry, no cookies, and no
					backend storing your code.
				</p>
				<p className='text-xs text-muted-foreground leading-relaxed'>
					Like any website, opening this page makes HTTP requests to load the assets. The hosting provider sees
					standard request metadata (IP address, user-agent) — that is outside this app's control. The page itself
					makes no further network calls while you format code.
				</p>
			</section>

			<section className='mt-8 space-y-3'>
				<h2 className='text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'>
					Credits
				</h2>
				<p className='text-sm text-foreground/90 leading-relaxed'>
					Built by{' '}
					<Link
						href='https://scheir.eu'
						target='_blank'
						className='text-primary hover:underline underline-offset-2'
					>
						Pieter-Jan Scheir
					</Link>
					.
				</p>
				<p className='text-sm text-foreground/90 leading-relaxed'>
					Powered by{' '}
					<Link
						href='https://prettier.io'
						target='_blank'
						className='text-primary hover:underline underline-offset-2'
					>
						Prettier
					</Link>
					,{' '}
					<Link
						href='https://nextjs.org'
						target='_blank'
						className='text-primary hover:underline underline-offset-2'
					>
						Next.js
					</Link>
					,{' '}
					<Link
						href='https://tailwindcss.com'
						target='_blank'
						className='text-primary hover:underline underline-offset-2'
					>
						Tailwind CSS
					</Link>
					, and{' '}
					<Link
						href='https://lucide.dev'
						target='_blank'
						className='text-primary hover:underline underline-offset-2'
					>
						Lucide
					</Link>
					.
				</p>
			</section>
		</main>
	)
}
