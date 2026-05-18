import { Loader2 } from 'lucide-react'

export default function Loading() {
	return (
		<main className='mx-auto max-w-md px-5 sm:px-6 py-20 sm:py-28 flex flex-col items-center text-center'>
			<Loader2
				size={20}
				className='animate-spin text-muted-foreground'
			/>
			<p className='mt-3 text-xs text-muted-foreground'>Loading…</p>
		</main>
	)
}
