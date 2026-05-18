'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, RotateCcw } from 'lucide-react'

export default function ErrorBoundary({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	useEffect(() => {
		console.error(error)
	}, [error])

	return (
		<main className='mx-auto max-w-md px-5 sm:px-6 py-20 sm:py-28 text-center'>
			<div className='inline-flex items-center justify-center w-12 h-12 rounded-lg bg-destructive/15 text-destructive mb-5'>
				<span className='text-base font-semibold tabular-nums'>500</span>
			</div>
			<h1 className='text-xl font-semibold tracking-tight'>Something went wrong</h1>
			<p className='mt-2 text-sm text-muted-foreground'>
				An unexpected error occurred. You can try again or head back home.
			</p>
			{error.digest && (
				<p className='mt-2 text-[11px] text-muted-foreground/70 font-mono'>ref: {error.digest}</p>
			)}
			<div className='mt-6 flex items-center justify-center gap-2'>
				<button
					type='button'
					onClick={reset}
					className='inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 active:scale-[0.98] transition-all'
				>
					<RotateCcw size={12} />
					Try again
				</button>
				<Link
					href='/'
					className='inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm border border-border hover:bg-secondary/60 transition-colors'
				>
					<ArrowLeft size={12} />
					Home
				</Link>
			</div>
		</main>
	)
}
