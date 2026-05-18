import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
	return (
		<main className='mx-auto max-w-md px-5 sm:px-6 py-20 sm:py-28 text-center'>
			<div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/15 text-primary mb-5'>
				<span className='text-base font-semibold tabular-nums'>404</span>
			</div>
			<h1 className='text-xl font-semibold tracking-tight'>Page not found</h1>
			<p className='mt-2 text-sm text-muted-foreground'>
				The page you’re looking for doesn’t exist or has been moved.
			</p>
			<Link
				href='/'
				className='inline-flex items-center gap-1.5 mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors'
			>
				<ArrowLeft size={12} />
				Back to formatter
			</Link>
		</main>
	)
}
