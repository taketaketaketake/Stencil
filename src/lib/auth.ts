import { signToken, verifyToken } from '../utils/jwt';
import { parse } from 'cookie';


// Helper to generate a redirect Response
function redirectToLogin(): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: '/login' }
  });
}

/**
 * Generate a JWT for a vendor.
 * @param vendorId - ID of the vendor from the database
 */
export function generateToken(vendorId: string): string {
  return signToken(vendorId);
}

/**
 * Require a valid JWT in cookies and return the vendor ID, or redirect to /login.
 */
export async function requireAuth(Astro: any): Promise<string | Response> {
  const cookieHeader = Astro.request.headers.get('cookie') || '';
  const cookies = parse(cookieHeader);
  const token = cookies.token;

  if (!token) {
    return redirectToLogin();
  }

  try {
    const payload = verifyToken(token);
    return payload.vendorId;
  } catch {
    return redirectToLogin();
  }
}