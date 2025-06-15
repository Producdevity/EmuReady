import { clerkMiddleware } from '@clerk/nextjs/server'
import type { NextRequest } from 'next/server'

export default clerkMiddleware((auth, req: NextRequest) => {
  const pathname = req.nextUrl.pathname

  // Skip Clerk middleware for webhook endpoints
  if (pathname.startsWith('/api/webhooks/')) {
    console.log('Skipping Clerk middleware for webhook:', pathname)
    return
  }

  // Skip Clerk middleware for mobile API routes to prevent CORS issues
  if (pathname.startsWith('/api/mobile/')) {
    console.log('Skipping Clerk middleware for mobile API:', pathname)
    return
  }

  // Skip Clerk middleware for the mobile test endpoint (TODO: remove later)
  if (pathname === '/api/mobile/test') {
    console.log('Skipping Clerk middleware for mobile test:', pathname)
    return
  }

  return
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes, but we'll handle exclusions in the middleware function
    '/(api|trpc)(.*)',
  ],
}
