import { cn } from '@/lib/utils'

interface Props {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showAccent?: boolean
  color?: string
}

const sizeMap = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

/**
 * RetroCatalog logo icon - official logo with 4 interlocking circles
 * Uses currentColor for theme adaptation, with optional brand color accent
 */
export function RetroCatalogIcon(props: Props) {
  const { size = 'md', showAccent = false, color } = props

  // Priority: color prop > showAccent > currentColor (inherited)
  const useAccentClass = !color && showAccent

  return (
    <svg
      viewBox="0 0 1805 1846"
      className={cn(
        sizeMap[size],
        'flex-shrink-0',
        useAccentClass ? 'text-brand-retrocatalog' : '',
        props.className,
      )}
      aria-hidden="true"
      style={{
        fillRule: 'evenodd',
        clipRule: 'evenodd',
        strokeLinejoin: 'round',
        strokeMiterlimit: 2,
        color: color,
      }}
    >
      <g transform="matrix(1,0,0,1,-624.35,-289.306)">
        {/* Bottom circle unit */}
        <g transform="matrix(1,0,0,1,0,-3.95154)">
          <path
            d="M1598.75,1528.65C1675.85,1543.77 1818.5,1678.05 1846.85,1812.49C1881.22,1975.39 1753.51,2112.31 1594.23,2118.19C1518.32,2120.99 1435.64,2109.49 1311.73,2002.62C1357.74,2036.33 1414.48,2056.24 1475.84,2056.24C1629.33,2056.24 1753.94,1931.63 1753.94,1778.15C1753.94,1668.77 1690.66,1574.06 1598.75,1528.65Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth={1}
          />
        </g>
        <g transform="matrix(1.11585,0,0,1.11585,-203.197,-236.076)">
          <circle
            cx={1504.71}
            cy={1801.56}
            r={249.225}
            fill="none"
            stroke="currentColor"
            strokeWidth={36.91}
            strokeLinecap="round"
            strokeMiterlimit={1.5}
          />
        </g>
        <g transform="matrix(1,0,0,1,0,-3.95154)">
          <path
            d="M1631.38,1546.9C1704.29,1594.93 1818.39,1677.58 1846.85,1812.49C1881.22,1975.39 1753.51,2112.31 1594.23,2118.19C1517.12,2121.04 1437.74,2105.12 1305.83,1997.49"
            fill="none"
            stroke="currentColor"
            strokeWidth={41.18}
            strokeMiterlimit={1.5}
          />
        </g>

        {/* Left circle unit */}
        <g transform="matrix(1,0,0,1,-552.798,-618.501)">
          <path
            d="M1598.75,1528.65C1675.85,1543.77 1818.5,1678.05 1846.85,1812.49C1881.22,1975.39 1753.51,2112.31 1594.23,2118.19C1518.32,2120.99 1435.64,2109.49 1311.73,2002.62C1357.74,2036.33 1414.48,2056.24 1475.84,2056.24C1629.33,2056.24 1753.94,1931.63 1753.94,1778.15C1753.94,1668.77 1690.66,1574.06 1598.75,1528.65Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth={1}
          />
          <g transform="matrix(1.11585,0,0,1.11585,-203.197,-232.125)">
            <circle
              cx={1504.71}
              cy={1801.56}
              r={249.225}
              fill="none"
              stroke="currentColor"
              strokeWidth={36.91}
              strokeLinecap="round"
              strokeMiterlimit={1.5}
            />
          </g>
          <path
            d="M1631.38,1546.9C1704.29,1594.93 1818.39,1677.58 1846.85,1812.49C1881.22,1975.39 1753.51,2112.31 1594.23,2118.19C1517.12,2121.04 1437.74,2105.12 1305.83,1997.49"
            fill="none"
            stroke="currentColor"
            strokeWidth={41.18}
            strokeMiterlimit={1.5}
          />
        </g>

        {/* Top circle unit */}
        <g transform="matrix(1,0,0,1,0,-1237)">
          <g transform="matrix(1,0,0,1,0,46.8522)">
            <path
              d="M1598.75,1528.65C1675.85,1543.77 1818.5,1678.05 1846.85,1812.49C1881.22,1975.39 1753.51,2112.31 1594.23,2118.19C1518.32,2120.99 1435.64,2109.49 1311.73,2002.62C1357.74,2036.33 1414.48,2056.24 1475.84,2056.24C1629.33,2056.24 1753.94,1931.63 1753.94,1778.15C1753.94,1668.77 1690.66,1574.06 1598.75,1528.65Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth={1}
            />
          </g>
          <g transform="matrix(1.11585,0,0,1.11585,-203.197,-185.272)">
            <circle
              cx={1504.71}
              cy={1801.56}
              r={249.225}
              fill="none"
              stroke="currentColor"
              strokeWidth={36.91}
              strokeLinecap="round"
              strokeMiterlimit={1.5}
            />
          </g>
          <g transform="matrix(1,0,0,1,0,46.8522)">
            <path
              d="M1631.38,1546.9C1704.29,1594.93 1818.39,1677.58 1846.85,1812.49C1881.22,1975.39 1753.51,2112.31 1594.23,2118.19C1517.12,2121.04 1437.74,2105.12 1305.83,1997.49"
              fill="none"
              stroke="currentColor"
              strokeWidth={41.18}
              strokeMiterlimit={1.5}
            />
          </g>
        </g>

        {/* Right circle unit */}
        <g transform="matrix(1,0,0,1,556.197,-618.501)">
          <path
            d="M1598.75,1528.65C1675.85,1543.77 1818.5,1678.05 1846.85,1812.49C1881.22,1975.39 1753.51,2112.31 1594.23,2118.19C1518.32,2120.99 1435.64,2109.49 1311.73,2002.62C1357.74,2036.33 1414.48,2056.24 1475.84,2056.24C1629.33,2056.24 1753.94,1931.63 1753.94,1778.15C1753.94,1668.77 1690.66,1574.06 1598.75,1528.65Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth={1}
          />
          <g transform="matrix(1.11585,0,0,1.11585,-203.197,-232.125)">
            <circle
              cx={1504.71}
              cy={1801.56}
              r={249.225}
              fill="none"
              stroke="currentColor"
              strokeWidth={36.91}
              strokeLinecap="round"
              strokeMiterlimit={1.5}
            />
          </g>
          <path
            d="M1631.38,1546.9C1704.29,1594.93 1818.39,1677.58 1846.85,1812.49C1881.22,1975.39 1753.51,2112.31 1594.23,2118.19C1517.12,2121.04 1437.74,2105.12 1305.83,1997.49"
            fill="none"
            stroke="currentColor"
            strokeWidth={41.18}
            strokeMiterlimit={1.5}
          />
        </g>
      </g>
    </svg>
  )
}
