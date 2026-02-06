import { type NextRequest, NextResponse } from 'next/server'

const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'

function extractSubdomain(request: NextRequest): string | null {
  const host = request.headers.get('host') || ''
  const hostname = host.split(':')[0]

  // Local development: support <slug>.localhost:3000
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    if (hostname.includes('.localhost')) {
      return hostname.split('.')[0]
    }
    return null
  }

  // Production: extract subdomain from full domain
  const rootDomainClean = rootDomain.split(':')[0]
  const isSubdomain =
    hostname !== rootDomainClean &&
    hostname !== `www.${rootDomainClean}` &&
    hostname.endsWith(`.${rootDomainClean}`)

  return isSubdomain ? hostname.replace(`.${rootDomainClean}`, '') : null
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const subdomain = extractSubdomain(request)

  if (subdomain) {
    // Block admin access from subdomains
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Rewrite subdomain requests to the internal /lista/[slug] route
    const rewritePath = `/lista/${subdomain}${pathname === '/' ? '' : pathname}`
    return NextResponse.rewrite(new URL(rewritePath, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next|[\\w-]+\\.\\w+).*)'],
}
