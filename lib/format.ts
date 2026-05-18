import { formatPython } from './python-format'

const PARSERS: Record<string, string> = {
	javascript: 'babel',
	typescript: 'typescript',
	json: 'json',
	css: 'css',
	scss: 'scss',
	less: 'less',
	html: 'html',
	vue: 'vue',
	markdown: 'markdown',
	yaml: 'yaml',
	graphql: 'graphql',
}

export type FormatOptions = {
	printWidth?: number
	tabWidth?: number
	useTabs?: boolean
	semi?: boolean
	singleQuote?: boolean
	trailingComma?: 'none' | 'es5' | 'all'
	arrowParens?: 'always' | 'avoid'
	bracketSpacing?: boolean
	bracketSameLine?: boolean
	proseWrap?: 'always' | 'never' | 'preserve'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadPlugins(parser: string): Promise<any[]> {
	switch (parser) {
		case 'babel':
		case 'json': {
			const [estree, babel] = await Promise.all([
				import('prettier/plugins/estree'),
				import('prettier/plugins/babel'),
			])
			return [estree.default, babel.default]
		}
		case 'typescript': {
			const [estree, ts] = await Promise.all([
				import('prettier/plugins/estree'),
				import('prettier/plugins/typescript'),
			])
			return [estree.default, ts.default]
		}
		case 'css':
		case 'scss':
		case 'less': {
			const css = await import('prettier/plugins/postcss')
			return [css.default]
		}
		case 'html':
		case 'vue': {
			const html = await import('prettier/plugins/html')
			return [html.default]
		}
		case 'markdown': {
			const md = await import('prettier/plugins/markdown')
			return [md.default]
		}
		case 'yaml': {
			const yaml = await import('prettier/plugins/yaml')
			return [yaml.default]
		}
		case 'graphql': {
			const gql = await import('prettier/plugins/graphql')
			return [gql.default]
		}
		default:
			return []
	}
}

export async function formatCode(code: string, language: string, options: FormatOptions): Promise<string> {
	if (!code) return ''

	if (language === 'python') {
		return formatPython(code, {
			tabWidth: clampInt(options.tabWidth, 1, 12, 4),
			useTabs: options.useTabs ?? false,
		})
	}

	const parser = PARSERS[language]
	if (!parser) throw new Error(`Unsupported language: ${language}`)

	const [{ format }, plugins] = await Promise.all([import('prettier/standalone'), loadPlugins(parser)])
	try {
		return await format(code, {
			parser,
			plugins,
			printWidth: clampInt(options.printWidth, 20, 400, 80),
			tabWidth: clampInt(options.tabWidth, 1, 12, 2),
			useTabs: options.useTabs ?? false,
			semi: options.semi ?? true,
			singleQuote: options.singleQuote ?? true,
			trailingComma: options.trailingComma ?? 'all',
			arrowParens: options.arrowParens ?? 'always',
			bracketSpacing: options.bracketSpacing ?? true,
			bracketSameLine: options.bracketSameLine ?? false,
			proseWrap: options.proseWrap ?? 'preserve',
			endOfLine: 'lf',
		})
	} catch (err) {
		const raw = err instanceof Error ? err.message : 'Failed to format code. Check your syntax.'
		// Strip ANSI escape codes (ESC [ ... m) Prettier emits in errors.
		// eslint-disable-next-line no-control-regex
		throw new Error(raw.replace(/\x1B\[[0-9;]*m/g, ''))
	}
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
	const n = typeof value === 'number' ? value : Number(value)
	if (!Number.isFinite(n)) return fallback
	return Math.max(min, Math.min(max, Math.round(n)))
}
