export function getDemoUserCookieOptions(maxAge?: number) {
  return {
    path: '/' as const,
    sameSite: 'lax' as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    ...(maxAge !== undefined ? { maxAge } : {}),
  }
}
