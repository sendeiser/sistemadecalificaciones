const { createClient } = require('@supabase/supabase-js');

const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Missing authorization token' });
    }

    try {
        // Create a client for the user to respect RLS
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            }
        );

        // Verify user
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = user;
        req.supabase = supabase;
        next();
    } catch (err) {
        console.error('Middleware error:', err);
        res.status(500).json({ error: 'Internal server error in auth middleware' });
    }
};

module.exports = authMiddleware;
