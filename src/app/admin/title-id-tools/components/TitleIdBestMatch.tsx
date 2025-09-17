import type { TitleIdSearchResult } from '@/schemas/titleId'

interface Props {
  titleIdResult: TitleIdSearchResult
}

export function TitleIdBestMatch(props: Props) {
  return (
    <div className="rounded-md border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-900/20 p-4">
      <p className="text-sm text-blue-900 dark:text-blue-200 font-medium mb-2">Best match</p>
      <div className="flex flex-wrap gap-4 text-sm text-blue-900 dark:text-blue-100">
        <span className="font-semibold">{props.titleIdResult.name}</span>
        <span className="font-mono text-xs">{props.titleIdResult.titleId}</span>
        <span>Score: {props.titleIdResult.score}</span>
        {props.titleIdResult.region && <span>Region: {props.titleIdResult.region}</span>}
        {props.titleIdResult.productCode && (
          <span>Product code: {props.titleIdResult.productCode}</span>
        )}
      </div>
    </div>
  )
}
