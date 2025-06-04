import { clerkMiddleware } from '@clerk/nextjs/server'
import type { NextRequest } from 'next/server'

export default clerkMiddleware((auth, req: NextRequest) => {
  // Skip Clerk middleware for webhook endpoints
  if (req.nextUrl.pathname.startsWith('/api/webhooks/')) {
    return
  }
  
  // Apply Clerk middleware for all other routes
  return
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes, but we'll handle webhook exclusion in the middleware function
    '/(api|trpc)(.*)',
  ],
}
