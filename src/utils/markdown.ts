import createDOMPurify, { type Config, type DOMPurify } from 'dompurify'
import MarkdownIt from 'markdown-it'
import type { JSDOM } from 'jsdom'

type JSDOMConstructor = typeof JSDOM
type JSDOMRequire = (moduleName: string) => { JSDOM: JSDOMConstructor }

declare const __non_webpack_require__: JSDOMRequire

// Runtime-only package name prevents client bundlers from statically including jsdom.
const JSDOM_PACKAGE_NAME = 'js' + 'dom'
const MARKDOWN_PARSE_ERROR = 'Invalid markdown syntax'
const HTML_ESCAPE_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

type MarkdownValidationResult =
  | {
      isValid: true
      cleanText: string
      errors: []
    }
  | {
      isValid: false
      cleanText: string
      errors: [typeof MARKDOWN_PARSE_ERROR]
    }

const md = new MarkdownIt({
  html: false,
  xhtmlOut: true,
  breaks: true,
  linkify: true,
  typographer: false,
})
const defaultValidateLink = md.validateLink.bind(md)

md.validateLink = function validateMarkdownLink(url: string) {
  if (url.trim().toLowerCase().startsWith('data:')) return false

  return defaultValidateLink(url)
}

md.renderer.rules.link_open = function linkOpen(tokens, idx, options, env, renderer) {
  const token = tokens[idx]
  token.attrSet('target', '_blank')
  token.attrSet('rel', 'noopener noreferrer')
  return renderer.renderToken(tokens, idx, options)
}

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'b',
  'i',
  'u',
  'strike',
  'del',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'a',
  'img',
  'hr',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
]

const ALLOWED_ATTR = ['href', 'title', 'alt', 'src', 'class', 'target', 'rel']

const PURIFY_CONFIG: Config = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
}

const TEXT_ONLY_CONFIG: Config = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
}

let purify: DOMPurify | null = null

function getPurify(): DOMPurify {
  purify ??= createPurify()

  return purify
}

function createPurify(): DOMPurify {
  if (typeof window !== 'undefined') {
    return createDOMPurify(window)
  }

  const JSDOM = loadJSDOM()

  return createDOMPurify(new JSDOM('').window)
}

function loadJSDOM(): JSDOMConstructor {
  if (typeof __non_webpack_require__ === 'function') {
    return __non_webpack_require__(JSDOM_PACKAGE_NAME).JSDOM
  }

  return getServerRequire()(JSDOM_PACKAGE_NAME).JSDOM
}

function getServerRequire(): JSDOMRequire {
  if (typeof process.getBuiltinModule !== 'function') {
    throw new Error('Node module loader is unavailable for server-side markdown sanitization')
  }

  const moduleBuiltin = process.getBuiltinModule('module')
  if (!moduleBuiltin) {
    throw new Error('Node module loader is unavailable for server-side markdown sanitization')
  }

  return moduleBuiltin.createRequire(`${process.cwd()}/package.json`)
}

function sanitizeHtml(html: string, config: Config = PURIFY_CONFIG): string {
  return getPurify().sanitize(html, config)
}

function escapeHtml(markdownText: string): string {
  return markdownText.replace(
    /[&<>"']/g,
    (character) => HTML_ESCAPE_ENTITIES[character] ?? character,
  )
}

function escapePlainText(markdownText: string): string {
  return escapeHtml(markdownText).replace(/\s+/g, ' ').trim()
}

function renderMarkdown(markdownText: string): string {
  return sanitizeHtml(md.render(markdownText))
}

export function parseMarkdown(markdownText: string): string {
  if (!markdownText) return ''

  try {
    return renderMarkdown(markdownText)
  } catch (error) {
    console.warn('Markdown parsing failed:', error)
    return escapeHtml(markdownText)
  }
}

export function hasMarkdownSyntax(text: string): boolean {
  if (!text) return false

  const markdownPatterns = [
    /\*\*.*?\*\*/,
    /\*.*?\*/,
    /`.*?`/,
    /^#{1,6}\s/m,
    /^\s*[\-*+]\s/m,
    /^\s*\d+\.\s/m,
    /\[.*?]\(.*?\)/,
    /^>\s/m,
    /```[\s\S]*?```/,
  ]

  return markdownPatterns.some((pattern) => pattern.test(text))
}

export function stripMarkdown(markdownText: string): string {
  if (!markdownText) return ''

  try {
    const html = md.render(markdownText)
    const textOnly = sanitizeHtml(html, TEXT_ONLY_CONFIG)

    return textOnly.replace(/\s+/g, ' ').trim()
  } catch (error) {
    console.warn('Stripping markdown failed:', error)
    return escapePlainText(markdownText)
  }
}

export function validateMarkdown(markdownText: string): {
  isValid: boolean
  cleanText: string
  errors: string[]
} {
  if (!markdownText) {
    return { isValid: true, cleanText: '', errors: [] }
  }

  try {
    return {
      isValid: true,
      cleanText: renderMarkdown(markdownText),
      errors: [],
    } satisfies MarkdownValidationResult
  } catch (error) {
    console.warn('Markdown validation failed:', error)
    return {
      isValid: false,
      cleanText: escapeHtml(markdownText),
      errors: [MARKDOWN_PARSE_ERROR],
    } satisfies MarkdownValidationResult
  }
}
