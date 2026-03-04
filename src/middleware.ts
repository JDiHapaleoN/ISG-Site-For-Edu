import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Normalizes IP to ignore minor dynamic changes (last block for IPv4, last 4 blocks for IPv6)
function normalizeIp(ip: string): string {
    if (!ip) return '0.0.0.0';
    if (ip.includes(':')) {
        // IPv6
        const parts = ip.split(':');
        return parts.slice(0, 4).join(':') + '::/64';
    }
    // IPv4
    const parts = ip.split('.');
    if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
    }
    return ip;
}

// Generate a fast hash of the IP using Web Crypto API and environment salt
async function generateIpHash(normalizedIp: string): Promise<string> {
    const salt = process.env.DATABASE_URL || 'default-salt-12495';
    const text = new TextEncoder().encode(normalizedIp + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', text);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user

    // Skip protection for API routes (they handle their own auth)
    if (request.nextUrl.pathname.startsWith('/api/')) {
        return supabaseResponse;
    }

    // Protected Route Redirect Logic
    const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/register') ||
        request.nextUrl.pathname.startsWith('/auth')

    if (!user && !isAuthRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    if (user && isAuthRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico
         * - Public files (images, manifest, service worker, etc.)
         * - API routes (they handle their own auth)
         */
        '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|workbox-.*\\.js|icons/.*|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|js|css|woff|woff2|ttf|eot)$).*)',
    ],
}
