import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    // CSRF Protection: Block mutating cross-origin requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
        const origin = request.headers.get('origin') ?? request.headers.get('referer');
        const host = request.headers.get('host');

        if (origin && host) {
            try {
                const originUrl = new URL(origin);
                // Strip port from host for robustness if needed, but nextUrl.host is usually reliable
                if (originUrl.host !== host) {
                    console.warn(`[Security] CSRF Blocked: Origin ${originUrl.host} !== Host ${host} on ${request.nextUrl.pathname}`);
                    return new NextResponse("Forbidden - CSRF origin mismatch", { status: 403 });
                }
            } catch (e) {
                return new NextResponse("Forbidden - Invalid origin format", { status: 403 });
            }
        }
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

    // IMPORTANT: Use getUser() instead of getSession() to verify the token
    // with the Supabase server. getSession() only reads the JWT locally
    // and can return stale/expired sessions.
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
        console.warn(`[Auth] getUser() error on ${request.nextUrl.pathname}: ${authError.message}`)
    }

    // Skip protection for API routes (they handle their own auth)
    if (request.nextUrl.pathname.startsWith('/api/')) {
        return supabaseResponse
    }

    const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/register') ||
        request.nextUrl.pathname.startsWith('/auth')

    // Redirect unauthenticated users to /login (with loop guard)
    if (!user && !isAuthRoute) {
        console.info(`[Auth] Unauthenticated access to ${request.nextUrl.pathname} → redirecting to /login`)
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Redirect authenticated users away from auth pages (with loop guard)
    if (user && isAuthRoute) {
        console.info(`[Auth] Authenticated user on ${request.nextUrl.pathname} → redirecting to /`)
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
         */
        '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|workbox-.*\\.js|icons/.*|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|js|css|woff|woff2|ttf|eot)$).*)',
    ],
}
