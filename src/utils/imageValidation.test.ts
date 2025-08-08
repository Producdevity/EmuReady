import { describe, it, expect } from 'vitest'
import {
  isValidImageUrl,
  isValidImageFilename,
  getImageExtension,
  isValidImageExtension,
  getImageValidationError,
  validateImageUrl,
  IMAGE_EXTENSIONS,
  IMAGE_EXTENSION_REGEX,
  IMAGE_FILENAME_REGEX,
} from './imageValidation'

describe('imageValidation', () => {
  describe('IMAGE_EXTENSIONS constant', () => {
    it('should contain all supported image extensions', () => {
      expect(IMAGE_EXTENSIONS).toEqual(['jpg', 'jpeg', 'png', 'gif', 'webp'])
    })
  })

  describe('isValidImageUrl', () => {
    describe('valid URLs', () => {
      it('should accept HTTP URLs with valid extensions', () => {
        expect(isValidImageUrl('http://example.com/image.jpg')).toBe(true)
        expect(isValidImageUrl('http://example.com/image.jpeg')).toBe(true)
        expect(isValidImageUrl('http://example.com/image.png')).toBe(true)
        expect(isValidImageUrl('http://example.com/image.gif')).toBe(true)
        expect(isValidImageUrl('http://example.com/image.webp')).toBe(true)
      })

      it('should accept HTTPS URLs with valid extensions', () => {
        expect(isValidImageUrl('https://example.com/image.jpg')).toBe(true)
        expect(isValidImageUrl('https://example.com/image.png')).toBe(true)
      })

      it('should be case insensitive for extensions', () => {
        expect(isValidImageUrl('https://example.com/image.JPG')).toBe(true)
        expect(isValidImageUrl('https://example.com/image.PNG')).toBe(true)
        expect(isValidImageUrl('https://example.com/image.GIF')).toBe(true)
      })

      it('should handle complex paths', () => {
        expect(isValidImageUrl('https://cdn.example.com/users/123/images/profile.jpg')).toBe(true)
        expect(isValidImageUrl('https://example.com/path/to/image.png?v=123')).toBe(true)
      })
    })

    describe('invalid URLs', () => {
      it('should reject non-HTTP(S) protocols', () => {
        expect(isValidImageUrl('ftp://example.com/image.jpg')).toBe(false)
        expect(isValidImageUrl('file:///path/to/image.jpg')).toBe(false)
      })

      it('should reject URLs without valid image extensions', () => {
        expect(isValidImageUrl('https://example.com/document.pdf')).toBe(false)
        expect(isValidImageUrl('https://example.com/video.mp4')).toBe(false)
        expect(isValidImageUrl('https://example.com/page.html')).toBe(false)
      })

      it('should reject malformed URLs', () => {
        expect(isValidImageUrl('not-a-url')).toBe(false)
        expect(isValidImageUrl('://missing-protocol.com/image.jpg')).toBe(false)
        expect(isValidImageUrl('')).toBe(false)
      })
    })

    describe('HTTPS requirement', () => {
      it('should reject HTTP when HTTPS is required', () => {
        expect(isValidImageUrl('http://example.com/image.jpg', true)).toBe(false)
      })

      it('should accept HTTPS when HTTPS is required', () => {
        expect(isValidImageUrl('https://example.com/image.jpg', true)).toBe(true)
      })
    })
  })

  describe('isValidImageFilename', () => {
    it('should accept valid filenames', () => {
      expect(isValidImageFilename('image.jpg')).toBe(true)
      expect(isValidImageFilename('my-image_2.png')).toBe(true)
      expect(isValidImageFilename('profile.123.gif')).toBe(true)
      expect(isValidImageFilename('logo.webp')).toBe(true)
    })

    it('should reject invalid filenames', () => {
      expect(isValidImageFilename('image without extension')).toBe(false)
      expect(isValidImageFilename('image.txt')).toBe(false)
      expect(isValidImageFilename('image with spaces.jpg')).toBe(false)
      expect(isValidImageFilename('image@symbol.png')).toBe(false)
    })

    it('should be case insensitive', () => {
      expect(isValidImageFilename('IMAGE.JPG')).toBe(true)
      expect(isValidImageFilename('Image.PNG')).toBe(true)
    })
  })

  describe('getImageExtension', () => {
    it('should extract extensions from URLs', () => {
      expect(getImageExtension('https://example.com/image.jpg')).toBe('jpg')
      expect(getImageExtension('https://example.com/image.PNG')).toBe('png')
      expect(getImageExtension('http://example.com/path/image.gif')).toBe('gif')
    })

    it('should extract extensions from filenames', () => {
      expect(getImageExtension('image.jpeg')).toBe('jpeg')
      expect(getImageExtension('logo.webp')).toBe('webp')
    })

    it('should return null for invalid extensions', () => {
      expect(getImageExtension('document.pdf')).toBe(null)
      expect(getImageExtension('video.mp4')).toBe(null)
      expect(getImageExtension('no-extension')).toBe(null)
    })
  })

  describe('isValidImageExtension', () => {
    it('should accept valid extensions', () => {
      expect(isValidImageExtension('jpg')).toBe(true)
      expect(isValidImageExtension('jpeg')).toBe(true)
      expect(isValidImageExtension('png')).toBe(true)
      expect(isValidImageExtension('gif')).toBe(true)
      expect(isValidImageExtension('webp')).toBe(true)
    })

    it('should be case insensitive', () => {
      expect(isValidImageExtension('JPG')).toBe(true)
      expect(isValidImageExtension('PNG')).toBe(true)
    })

    it('should reject invalid extensions', () => {
      expect(isValidImageExtension('pdf')).toBe(false)
      expect(isValidImageExtension('mp4')).toBe(false)
      expect(isValidImageExtension('txt')).toBe(false)
    })
  })

  describe('getImageValidationError', () => {
    it('should return empty string for valid URLs', () => {
      expect(getImageValidationError('https://example.com/image.jpg')).toBe('')
      expect(getImageValidationError('http://example.com/image.png')).toBe('')
    })

    it('should return error for empty URLs', () => {
      expect(getImageValidationError('')).toBe('Image URL is required')
      expect(getImageValidationError('   ')).toBe('Image URL is required')
    })

    it('should return error for invalid URLs', () => {
      expect(getImageValidationError('not-a-url')).toBe('Please enter a valid URL')
    })

    it('should return error for non-HTTPS when required', () => {
      expect(getImageValidationError('http://example.com/image.jpg', true)).toBe(
        'Image URL must use HTTPS protocol',
      )
    })

    it('should return error for invalid protocols', () => {
      expect(getImageValidationError('ftp://example.com/image.jpg')).toBe(
        'Image URL must use HTTP or HTTPS protocol',
      )
    })

    it('should return error for invalid extensions', () => {
      expect(getImageValidationError('https://example.com/document.pdf')).toBe(
        'Image URL must end with a valid extension: jpg, jpeg, png, gif, webp',
      )
    })
  })

  describe('validateImageUrl', () => {
    it('should return success result for valid URLs', () => {
      const result = validateImageUrl('https://example.com/image.jpg')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should return error result for invalid URLs', () => {
      const result = validateImageUrl('invalid-url')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Please enter a valid URL')
    })

    it('should handle HTTPS requirement', () => {
      const result = validateImageUrl('http://example.com/image.jpg', true)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Image URL must use HTTPS protocol')
    })
  })

  describe('regex patterns', () => {
    it('IMAGE_EXTENSION_REGEX should match valid extensions', () => {
      expect(IMAGE_EXTENSION_REGEX.test('image.jpg')).toBe(true)
      expect(IMAGE_EXTENSION_REGEX.test('image.PNG')).toBe(true)
      expect(IMAGE_EXTENSION_REGEX.test('path/to/image.gif')).toBe(true)
      expect(IMAGE_EXTENSION_REGEX.test('image.pdf')).toBe(false)
    })

    it('IMAGE_FILENAME_REGEX should match valid filenames', () => {
      expect(IMAGE_FILENAME_REGEX.test('valid-file_name.jpg')).toBe(true)
      expect(IMAGE_FILENAME_REGEX.test('invalid file name.jpg')).toBe(false)
      expect(IMAGE_FILENAME_REGEX.test('file@symbol.jpg')).toBe(false)
    })
  })
})
