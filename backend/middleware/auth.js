const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Verifies the Supabase JWT from the Authorization header.
 * Attaches req.user on success.
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in to plan a trip.' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.warn('[Auth Middleware] Invalid token:', error?.message);
      return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth Middleware] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Authentication check failed. Please try again.' });
  }
}

module.exports = { authMiddleware };
