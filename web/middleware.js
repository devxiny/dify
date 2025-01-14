import { NextResponse } from 'next/server'

const TARGET_BASE_URL = 'http://10.1.11.201:50002'

export async function middleware(request) {
    if (request.nextUrl.pathname == '/api/chat-messages') {
        const targetUrl = new URL(request.nextUrl.pathname, TARGET_BASE_URL)
        targetUrl.search = request.nextUrl.search

        const response = await fetch(targetUrl, {
            method: request.method,
            headers: request.headers,
            body: request.body,
        })

        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body.getReader()
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    controller.enqueue(value)
                }
                controller.close()
            },
        })

        return new NextResponse(stream, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        })
    }

    if (request.nextUrl.pathname.startsWith('/api')) {
        const targetUrl = new URL(request.nextUrl.pathname, TARGET_BASE_URL)
        targetUrl.search = request.nextUrl.search
        return NextResponse.rewrite(targetUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: '/api/:path*',
}