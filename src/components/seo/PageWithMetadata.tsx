import Script from 'next/script'
import { type PropsWithChildren } from 'react'

interface Props extends PropsWithChildren {
  structuredData?: Record<string, unknown> | Record<string, unknown>[]
}

export function PageWithMetadata(props: Props) {
  const structuredDataArray = Array.isArray(props.structuredData)
    ? props.structuredData
    : props.structuredData
      ? [props.structuredData]
      : []

  return (
    <>
      {structuredDataArray.map((data, index) => (
        <Script
          key={`structured-data-${index}`}
          id={`structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(data),
          }}
        />
      ))}
      {props.children}
    </>
  )
}
