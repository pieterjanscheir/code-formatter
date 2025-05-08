import { CodeFormatter } from '../components/code-formatter'

export default function Home() {
	return (
		<main className='container mx-auto py-20 px-4 max-w-7xl relative overflow-hidden'>
			<div className='text-center mb-16 relative z-10'>
				<h1 className='text-4xl md:text-5xl font-bold mb-4 tracking-tight bg-gradient-to-r from-primary/90 to-accent/80 text-transparent bg-clip-text'>
					Magical Code Formatter
				</h1>
				<p className='text-lg text-muted-foreground max-w-xl mx-auto font-light'>
					Transform your code with a touch of enchanting magic ✨
				</p>
			</div>

			{/* Subtle background gradient */}
			<div className='absolute inset-0 bg-gradient-to-b from-background/5 via-accent/5 to-primary/5 -z-10' />

			<div className='relative z-10'>
				``
				<CodeFormatter />
			</div>
		</main>
	)
}
