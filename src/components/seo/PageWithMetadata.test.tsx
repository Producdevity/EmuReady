import { render, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { PageWithMetadata } from './PageWithMetadata'

it('encodes JSON-LD for the script context without changing the underlying text', async () => {
  const data = {
    '@type': 'Review',
    reviewBody: 'resolution=1080 <3 </script><script data-injected>alert(1)</script>',
  }
  render(<PageWithMetadata structuredData={data}>Report</PageWithMetadata>)
  try {
    await waitFor(() => expect(document.getElementById('structured-data-0')).not.toBeNull())
    const content = document.getElementById('structured-data-0')?.textContent ?? ''
    expect(content).not.toContain('<')
    expect(JSON.parse(content)).toEqual(data)
    expect(document.querySelector('script[data-injected]')).toBeNull()
  } finally {
    document.getElementById('structured-data-0')?.remove()
  }
})
