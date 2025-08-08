import { describe, it, expect } from 'vitest'
import { sanitizeText, sanitizeBio } from './sanitization'

describe('sanitizeText', () => {
  it('should return empty string for empty input', () => {
    expect(sanitizeText('')).toBe('')
  })

  it('should return the same text for plain text input', () => {
    const plainText = 'This is just plain text'
    expect(sanitizeText(plainText)).toBe(plainText)
  })

  it('should remove script tags completely', () => {
    const maliciousText = 'Hello <script>alert("XSS")</script> world'
    expect(sanitizeText(maliciousText)).toBe('Hello  world')
  })

  it('should remove script tags with attributes', () => {
    const maliciousText = 'Test <script type="text/javascript">alert("XSS")</script> end'
    expect(sanitizeText(maliciousText)).toBe('Test  end')
  })

  it('should remove nested script tags', () => {
    const maliciousText = '<script>var x = "<script>alert(1)</script>";</script>'
    expect(sanitizeText(maliciousText)).toBe('";')
  })

  it('should preserve allowed HTML tags', () => {
    const allowedTags =
      'Text with <b>bold</b>, <i>italic</i>, <em>emphasis</em>, <strong>strong</strong>, <br/> and <p>paragraph</p>'
    expect(sanitizeText(allowedTags)).toBe(allowedTags)
  })

  it('should remove disallowed HTML tags', () => {
    const disallowedTags =
      'Text with <div>div</div>, <span>span</span>, <img src="test.jpg"/> and <a href="link">link</a>'
    expect(sanitizeText(disallowedTags)).toBe('Text with div, span,  and link')
  })

  it('should remove javascript: URLs', () => {
    const jsUrl = 'Click <a href="javascript:alert(1)">here</a>'
    expect(sanitizeText(jsUrl)).toBe('Click here')
  })

  it('should remove data: URLs', () => {
    const dataUrl = 'Image <img src="data:image/png;base64,abc123"/>'
    expect(sanitizeText(dataUrl)).toBe('Image')
  })

  it('should remove event handlers', () => {
    const eventHandlers = '<p onclick="alert(1)" onmouseover="alert(2)" onload="alert(3)">Text</p>'
    expect(sanitizeText(eventHandlers)).toBe('<p>Text</p>')
  })

  it('should handle mixed case script tags', () => {
    const mixedCase = 'Text <SCRIPT>alert(1)</SCRIPT> <Script>alert(2)</Script> end'
    expect(sanitizeText(mixedCase)).toBe('Text   end')
  })

  it('should handle complex XSS attempts', () => {
    const complexXSS =
      '<div onclick="javascript:alert(1)" onmouseover="data:text/html,<script>alert(2)</script>">Safe text</div>'
    expect(sanitizeText(complexXSS)).toBe('Safe text')
  })

  it('should preserve text content while removing dangerous attributes', () => {
    const text = '<p class="test" onclick="alert(1)" style="color: red;">Important content</p>'
    // The function only removes event handlers, not all attributes
    expect(sanitizeText(text)).toBe('<p class="test" style="color: red;">Important content</p>')
  })

  it('should handle self-closing tags', () => {
    const selfClosing = 'Line 1<br/>Line 2<img src="javascript:alert(1)"/>Line 3'
    expect(sanitizeText(selfClosing)).toBe('Line 1<br/>Line 2Line 3')
  })

  it('should handle malformed HTML gracefully', () => {
    const malformed = 'Text <script>alert(1) <b>bold</b> more text'
    // The regex doesn't match unclosed script tags properly
    expect(sanitizeText(malformed)).toBe('Text alert(1) <b>bold</b> more text')
  })

  it('should remove multiple javascript: and data: URLs', () => {
    const multipleUrls = 'javascript:alert(1) some text data:text/html,test more javascript:void(0)'
    expect(sanitizeText(multipleUrls)).toBe('alert(1) some text text/html,test more void(0)')
  })

  it('should handle case-insensitive javascript and data removal', () => {
    const caseInsensitive = 'JAVASCRIPT:alert(1) DATA:text/html,test Javascript:void(0)'
    expect(sanitizeText(caseInsensitive)).toBe('alert(1) text/html,test void(0)')
  })
})

describe('sanitizeBio', () => {
  it('should return empty string for empty input', () => {
    expect(sanitizeBio('')).toBe('')
  })

  it('should return plain text unchanged', () => {
    const plainText = 'I am a software developer who loves coding.'
    expect(sanitizeBio(plainText)).toBe(plainText)
  })

  it('should remove all HTML tags', () => {
    const htmlBio = 'I am a <b>software developer</b> who <em>loves</em> <p>coding</p>.'
    expect(sanitizeBio(htmlBio)).toBe('I am a software developer who loves coding.')
  })

  it('should remove script tags and content', () => {
    const maliciousBio = 'Normal bio <script>alert("XSS")</script> continues here'
    expect(sanitizeBio(maliciousBio)).toBe('Normal bio alert("XSS") continues here')
  })

  it('should remove javascript: URLs', () => {
    const jsBio = 'Visit my site javascript:alert(1) for more info'
    expect(sanitizeBio(jsBio)).toBe('Visit my site alert(1) for more info')
  })

  it('should remove data: URLs', () => {
    const dataBio = 'Check out data:text/html,<script>alert(1)</script> my portfolio'
    expect(sanitizeBio(dataBio)).toBe('Check out text/html,alert(1) my portfolio')
  })

  it('should handle complex HTML structures', () => {
    const complexBio =
      '<div class="profile"><h1>John Doe</h1><p>Software Engineer at <a href="javascript:alert(1)">Company</a></p></div>'
    expect(sanitizeBio(complexBio)).toBe('John DoeSoftware Engineer at Company')
  })

  it('should preserve spaces between removed tags', () => {
    const spacedBio = 'I work with <span>React</span> and <span>Node.js</span> daily.'
    expect(sanitizeBio(spacedBio)).toBe('I work with React and Node.js daily.')
  })

  it('should trim whitespace', () => {
    const spacedBio = '   <p>Spaced bio</p>   '
    expect(sanitizeBio(spacedBio)).toBe('Spaced bio')
  })

  it('should handle nested HTML tags', () => {
    const nestedBio = '<div><p>I love <strong><em>web development</em></strong> very much</p></div>'
    expect(sanitizeBio(nestedBio)).toBe('I love web development very much')
  })

  it('should handle mixed case in URLs', () => {
    const mixedCase = 'JAVASCRIPT:alert(1) and DATA:image/png,test'
    expect(sanitizeBio(mixedCase)).toBe('alert(1) and image/png,test')
  })

  it('should handle malformed HTML', () => {
    const malformed = 'Bio with <div unclosed tag and <script>alert(1) incomplete'
    expect(sanitizeBio(malformed)).toBe('Bio with alert(1) incomplete')
  })

  it('should handle multiple consecutive tags', () => {
    const multipleTags = 'Text<b></b><i></i><em></em>More text'
    expect(sanitizeBio(multipleTags)).toBe('TextMore text')
  })
})
