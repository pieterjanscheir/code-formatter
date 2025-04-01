import { NextResponse } from 'next/server'
import prettier from 'prettier'

export async function POST(request: Request) {
	try {
		const { code, language } = await request.json()

		if (!code) {
			return NextResponse.json({ error: 'No code provided' }, { status: 400 })
		}

		const parser = language === 'typescript' ? 'typescript' : 'babel'

		const formatted = await prettier.format(code, {
			parser,
			semi: true,
			singleQuote: true,
			trailingComma: 'all',
			printWidth: 80,
			tabWidth: 2,
		})

		return NextResponse.json({ formatted })
	} catch (error) {
		console.error('Error formatting code:', error)
		return NextResponse.json({ error: 'Failed to format code. Check if your syntax is correct.' }, { status: 500 })
	}
}
