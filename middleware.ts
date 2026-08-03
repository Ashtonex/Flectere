import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const NOT_CONFIGURED_HTML = `<!doctype html>
<html><head><meta charset="utf-8"><title>Hub not configured</title></head>
<body style="font-family: ui-sans-serif, system-ui; background: #0b0e14; color: #f5f7fa; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 2rem; text-align: center;">
  <div style="max-width: 32rem;">
    <p style="text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.75rem; color: #c6a159; margin-bottom: 1rem;">Flectēre Hub</p>
    <h1 style="font-size: 1.5rem; margin-bottom: 1rem;">Not configured yet</h1>
    <p style="color: #9aa4b6; line-height: 1.6;">
      This environment is missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
      See the "The Hub" section in README.md for setup steps.
    </p>
  </div>
</body></html>`;

// Scoped to /hub only (see matcher below) — the public marketing site
// never touches Supabase or auth cookies.
export async function middleware(request: NextRequest) {
  // Without these, @supabase/ssr throws synchronously on client creation.
  // Fail with a clear, static message instead of an unhandled 500.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return new NextResponse(NOT_CONFIGURED_HTML, {
      status: 503,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getClaims() validates the JWT signature server-side — unlike
  // getSession(), it's safe to use for an authorization decision.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const isLoginPage = request.nextUrl.pathname === "/hub/login";

  if (!claims && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/hub/login";
    return NextResponse.redirect(url);
  }

  if (claims && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/hub";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/hub/:path*"],
};
