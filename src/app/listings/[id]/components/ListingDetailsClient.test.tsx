import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ListingDetailsClient, { type Listing } from './ListingDetailsClient'

vi.mock('@/lib/api', () => ({
  api: {
    useUtils: () => ({
      listings: {
        byId: {
          invalidate: vi.fn(),
        },
      },
    }),
  },
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

vi.mock('next/image', () => ({
  default: ({ alt, ...props }: any) => <img alt={alt} {...props} />,
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('@/components/ui', () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  Badge: ({ children, variant }: any) => (
    <span data-variant={variant}>{children}</span>
  ),
}))

vi.mock('./VoteButtons', () => ({
  default: () => <div data-testid="vote-buttons">Vote Buttons</div>,
}))

vi.mock('./CommentThread', () => ({
  default: () => <div data-testid="comment-thread">Comment Thread</div>,
}))

describe('ListingDetailsClient', () => {
  const mockListing: Listing = {
    id: 'listing-1',
    game: {
      title: 'Super Mario Bros',
      system: { name: 'Nintendo Entertainment System' },
    },
    device: {
      brand: { name: 'Samsung' },
      modelName: 'Galaxy S21',
    },
    emulator: { name: 'RetroArch' },
    performance: { label: 'Perfect' },
    notes: 'Runs great with default settings',
    author: {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      profileImage: null,
    },
  }

  const defaultProps = {
    listing: mockListing,
    successRate: 0.85,
    upVotes: 17,
    totalVotes: 20,
    userVote: null,
  }

  it('should render basic listing information', () => {
    render(<ListingDetailsClient {...defaultProps} />)

    expect(screen.getByText('Super Mario Bros')).toBeInTheDocument()
    expect(
      screen.getByText(/Nintendo Entertainment System/),
    ).toBeInTheDocument()
    expect(screen.getByText(/Samsung Galaxy S21/)).toBeInTheDocument()
    expect(screen.getByText(/RetroArch/)).toBeInTheDocument()
    expect(screen.getByText(/Perfect/)).toBeInTheDocument()
    expect(
      screen.getByText('Runs great with default settings'),
    ).toBeInTheDocument()
  })

  it('should display custom field values when present', () => {
    const listingWithCustomFields: Listing = {
      ...mockListing,
      customFieldValues: [
        {
          id: 'cfv-1',
          value: 'OpenGL',
          customFieldDefinition: {
            id: 'cfd-1',
            label: 'Graphics Driver',
            name: 'graphics_driver',
            type: 'TEXT',
          },
        },
        {
          id: 'cfv-2',
          value: true,
          customFieldDefinition: {
            id: 'cfd-2',
            label: 'Hardware Acceleration',
            name: 'hardware_acceleration',
            type: 'BOOLEAN',
          },
        },
        {
          id: 'cfv-3',
          value: 'high',
          customFieldDefinition: {
            id: 'cfd-3',
            label: 'Quality Setting',
            name: 'quality_setting',
            type: 'SELECT',
            options: [
              { value: 'low', label: 'Low Quality' },
              { value: 'medium', label: 'Medium Quality' },
              { value: 'high', label: 'High Quality' },
            ],
          },
        },
        {
          id: 'cfv-4',
          value: 'https://example.com/config',
          customFieldDefinition: {
            id: 'cfd-4',
            label: 'Config File',
            name: 'config_file',
            type: 'URL',
          },
        },
      ],
    }

    render(
      <ListingDetailsClient
        {...defaultProps}
        listing={listingWithCustomFields}
      />,
    )

    // Check that the custom fields section is displayed
    expect(screen.getByText('Emulator-Specific Details')).toBeInTheDocument()

    // Check TEXT field
    expect(screen.getByText('Graphics Driver:')).toBeInTheDocument()
    expect(screen.getByText('OpenGL')).toBeInTheDocument()

    // Check BOOLEAN field
    expect(screen.getByText('Hardware Acceleration:')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()

    // Check SELECT field (should show label, not value)
    expect(screen.getByText('Quality Setting:')).toBeInTheDocument()
    expect(screen.getByText('High Quality')).toBeInTheDocument()

    // Check URL field (should be a link)
    expect(screen.getByText('Config File:')).toBeInTheDocument()
    const configLink = screen.getByRole('link', {
      name: 'https://example.com/config',
    })
    expect(configLink).toHaveAttribute('href', 'https://example.com/config')
    expect(configLink).toHaveAttribute('target', '_blank')
  })

  it('should not display custom fields section when no custom fields exist', () => {
    render(<ListingDetailsClient {...defaultProps} />)

    expect(
      screen.queryByText('Emulator-Specific Details'),
    ).not.toBeInTheDocument()
  })

  it('should handle boolean false values correctly', () => {
    const listingWithFalseBooleanField: Listing = {
      ...mockListing,
      customFieldValues: [
        {
          id: 'cfv-1',
          value: false,
          customFieldDefinition: {
            id: 'cfd-1',
            label: 'Enable Feature',
            name: 'enable_feature',
            type: 'BOOLEAN',
          },
        },
      ],
    }

    render(
      <ListingDetailsClient
        {...defaultProps}
        listing={listingWithFalseBooleanField}
      />,
    )

    expect(screen.getByText('Enable Feature:')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
  })

  it('should handle empty or null values gracefully', () => {
    const listingWithEmptyFields: Listing = {
      ...mockListing,
      customFieldValues: [
        {
          id: 'cfv-1',
          value: '',
          customFieldDefinition: {
            id: 'cfd-1',
            label: 'Optional Field',
            name: 'optional_field',
            type: 'TEXT',
          },
        },
        {
          id: 'cfv-2',
          value: null,
          customFieldDefinition: {
            id: 'cfd-2',
            label: 'Null Field',
            name: 'null_field',
            type: 'TEXTAREA',
          },
        },
      ],
    }

    render(
      <ListingDetailsClient
        {...defaultProps}
        listing={listingWithEmptyFields}
      />,
    )

    expect(screen.getByText('Optional Field:')).toBeInTheDocument()
    expect(screen.getByText('Null Field:')).toBeInTheDocument()
    // Both should render as empty strings
  })
})
