export async function buildBackendHeaders(supabase?: any) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession()
      const accessToken = data?.session?.access_token

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`
      }
    } catch {
      // Ignore and fallback to service token if configured
    }
  }

  if (!headers.Authorization) {
    const backendToken = process.env.BACKEND_API_TOKEN
    if (backendToken) {
      headers.Authorization = `Bearer ${backendToken}`
    }
  }

  return headers
}
