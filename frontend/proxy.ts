import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                    })
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // 1. Capture the authenticated user
    const { data: { user } } = await supabase.auth.getUser()

    // 2. Define public routes that don't require being logged in.
    //    '/' is the marketing landing page — exact match only, so the
    //    startsWith check below can't accidentally make every route public.
    const publicRoutes = [
        '/login',
        '/signup',
        '/forgot-password',
        '/reset-password',
        '/auth/callback',
    ]
    const isPublicRoute =
        request.nextUrl.pathname === '/' ||
        publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))

    // 3. If no user is logged in and they are trying to access a protected page, redirect to /login
    if (!user && !isPublicRoute) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // 4. If a signed-in user hits an auth entry screen, send them straight to
    //    the app. '/reset-password' is excluded — recovery legitimately runs
    //    while a session exists (verifyOtp for type "recovery" signs the user
    //    in before updateUser() sets the new password).
    const authEntryRoutes = ['/login', '/signup']
    const isAuthEntryRoute = authEntryRoutes.some(
        route => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(`${route}/`)
    )
    if (user && isAuthEntryRoute) {
        return NextResponse.redirect(new URL('/dash', request.url))
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - Any file with an extension (e.g. .svg, .png, .jpg)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}