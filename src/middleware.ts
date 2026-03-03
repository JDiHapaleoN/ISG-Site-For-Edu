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

    // --- IP ANALYZER & SESSION PROTECTION ---
    if (user) {
        const rawIp = request.headers.get('x-forwarded-for') || request.ip || '127.0.0.1';
        const normalizedIp = normalizeIp(rawIp.split(',')[0].trim());
        const currentIpHash = await generateIpHash(normalizedIp);

        const storedIpHash = request.cookies.get('sb-ip-lock')?.value;

        if (!storedIpHash) {
            // First time seeing this user session, lock it to their current normalized IP
            supabaseResponse.cookies.set('sb-ip-lock', currentIpHash, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 30 // 30 days
            });
        } else if (storedIpHash !== currentIpHash) {
            // IP has changed significantly (suspicious session hijack or totally new location)
            // Log them out by removing Supabase auth cookies and the lock
            console.warn(`[Suspicious Activity] IP Hash Mismatch for user ${user.id}. Forcing logout.`);
            await supabase.auth.signOut();

            const url = request.nextUrl.clone()
            url.pathname = '/login'
            url.searchParams.set('reason', 'ip-changed')
            const redirectResponse = NextResponse.redirect(url)

            // Delete cookies in the REDIRECT response (not supabaseResponse)
            request.cookies.getAll().forEach((cookie) => {
                if (cookie.name.startsWith('sb-') || cookie.name === 'sb-ip-lock') {
                    redirectResponse.cookies.delete(cookie.name);
                }
            });

            return redirectResponse
        }

        // If user is already logged in and tries to access an auth route, redirect to home
        if (isAuthRoute) {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }
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
