// Lightweight Python prettifier. Not a full PEP 8 formatter — Prettier has
// no Python parser, and shipping a real one (Black/Ruff via WASM) would add
// megabytes. This does a set of safe, line-based transforms:
//   - normalises indentation (tabs ↔ spaces) based on the user's settings
//   - trims trailing whitespace
//   - collapses 3+ blank lines to 2 between top-level blocks (1 inside)
//   - removes blank lines right after a block opener (def/class/if/...:)
//   - ensures a single trailing newline
//   - normalises spaces after `,` and `:` outside of strings and comments
//   - normalises spaces around binary operators outside of strings/comments

type PyOptions = {
	tabWidth: number
	useTabs: boolean
}

const BLOCK_OPENERS = /^\s*(def|class|if|elif|else|for|while|try|except|finally|with|match|case)\b.*:\s*(#.*)?$/

export function formatPython(src: string, opts: PyOptions): string {
	const indentUnit = opts.useTabs ? '\t' : ' '.repeat(Math.max(1, opts.tabWidth))
	const lines = src.replace(/\r\n?/g, '\n').split('\n')

	// 1. Re-indent: detect existing indent unit (first non-empty indented line) then convert.
	const detected = detectIndentUnit(lines)
	const reindented = lines.map((line) => reindentLine(line, detected, indentUnit))

	// 2. Per-line whitespace normalisation (skipping strings/comments).
	const tidied = reindented.map((line) => normaliseLine(line))

	// 3. Blank-line collapsing.
	const collapsed = collapseBlankLines(tidied)

	// 4. Ensure trailing newline.
	const joined = collapsed.join('\n').replace(/\n*$/, '\n')
	return joined
}

function detectIndentUnit(lines: string[]): string {
	for (const line of lines) {
		if (!line.trim()) continue
		const m = /^([\t ]+)/.exec(line)
		if (m) return m[1]
	}
	return '    '
}

function reindentLine(line: string, fromUnit: string, toUnit: string): string {
	const m = /^([\t ]*)(.*)$/.exec(line)
	if (!m) return line
	const indent = m[1]
	const rest = m[2]
	if (!indent) return rest
	// Compute levels from existing indent: count repetitions of fromUnit at the start; fall back to spaces / 4.
	let levels = 0
	let i = 0
	if (fromUnit && indent.startsWith(fromUnit)) {
		while (indent.startsWith(fromUnit, i)) {
			levels++
			i += fromUnit.length
		}
	}
	// If anything remains, treat any leftover indent as one extra level (best-effort).
	if (i < indent.length) levels += 1
	return toUnit.repeat(levels) + rest
}

function normaliseLine(line: string): string {
	// Split into code + trailing comment (respecting strings).
	const { code, comment } = splitCodeAndComment(line)
	const fixed = fixSpacing(code)
	const out = comment === null ? fixed : `${fixed.replace(/\s+$/, '')}  ${comment}`
	return out.replace(/[\t ]+$/, '')
}

function splitCodeAndComment(line: string): { code: string; comment: string | null } {
	let inStr: '"' | "'" | null = null
	let triple = false
	for (let i = 0; i < line.length; i++) {
		const c = line[i]
		if (inStr) {
			if (c === '\\') {
				i++
				continue
			}
			if (triple) {
				if (c === inStr && line[i + 1] === inStr && line[i + 2] === inStr) {
					i += 2
					inStr = null
					triple = false
				}
			} else if (c === inStr) {
				inStr = null
			}
			continue
		}
		if (c === '"' || c === "'") {
			if (line[i + 1] === c && line[i + 2] === c) {
				triple = true
				inStr = c
				i += 2
			} else {
				inStr = c
			}
			continue
		}
		if (c === '#') {
			return { code: line.slice(0, i), comment: line.slice(i) }
		}
	}
	return { code: line, comment: null }
}

function fixSpacing(code: string): string {
	if (!code.trim()) return code
	let out = ''
	let inStr: '"' | "'" | null = null
	let triple = false
	for (let i = 0; i < code.length; i++) {
		const c = code[i]
		if (inStr) {
			out += c
			if (c === '\\') {
				out += code[i + 1] ?? ''
				i++
				continue
			}
			if (triple) {
				if (c === inStr && code[i + 1] === inStr && code[i + 2] === inStr) {
					out += code[i + 1] + code[i + 2]
					i += 2
					inStr = null
					triple = false
				}
			} else if (c === inStr) {
				inStr = null
			}
			continue
		}
		if (c === '"' || c === "'") {
			if (code[i + 1] === c && code[i + 2] === c) {
				out += c + code[i + 1] + code[i + 2]
				i += 2
				triple = true
				inStr = c
			} else {
				out += c
				inStr = c
			}
			continue
		}
		// Space after comma (if next isn't already a space/closing bracket/end).
		if (c === ',') {
			out += ','
			const next = code[i + 1]
			if (next && next !== ' ' && next !== '\t' && next !== ')' && next !== ']' && next !== '}' && next !== ',') {
				out += ' '
			}
			continue
		}
		out += c
	}
	// Collapse double spaces between tokens (preserve leading indent already preserved).
	const leadingMatch = /^[\t ]*/.exec(out)
	const leading = leadingMatch ? leadingMatch[0] : ''
	const body = out.slice(leading.length).replace(/[ \t]{2,}/g, ' ')
	return leading + body
}

function collapseBlankLines(lines: string[]): string[] {
	const out: string[] = []
	let blankRun = 0
	let lastNonBlankIndent = 0
	let lastNonBlankOpened = false

	for (const raw of lines) {
		const line = raw.replace(/[\t ]+$/, '')
		if (line.trim() === '') {
			blankRun++
			continue
		}
		const indent = leadingWhitespace(line).length
		if (blankRun > 0) {
			// If we're still inside the previous block (indent > 0), allow 1 blank max.
			// At top-level (indent == 0) allow up to 2 blanks before def/class lines.
			let allowed = indent > 0 ? 1 : 2
			// No blank line right after a block opener (def/class/...:).
			if (lastNonBlankOpened && indent > lastNonBlankIndent) allowed = 0
			for (let i = 0; i < Math.min(blankRun, allowed); i++) out.push('')
			blankRun = 0
		}
		out.push(line)
		lastNonBlankIndent = indent
		lastNonBlankOpened = BLOCK_OPENERS.test(line)
	}
	return out
}

function leadingWhitespace(line: string): string {
	const m = /^[\t ]*/.exec(line)
	return m ? m[0] : ''
}
