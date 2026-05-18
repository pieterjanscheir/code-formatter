import { CodeFormatter } from '../components/code-formatter'

export default function Home() {
	return (
		<main className='mx-auto max-w-6xl px-5 sm:px-6 py-8 sm:py-12'>
			<header className='mb-6 sm:mb-8'>
				<h1 className='text-xl sm:text-2xl font-semibold tracking-tight'>Code Formatter</h1>
				<p className='mt-1 text-sm text-muted-foreground'>
					Format JavaScript, TypeScript, JSON, CSS, HTML, Markdown, and more.
				</p>
			</header>
			<CodeFormatter />
		</main>
	)
}
