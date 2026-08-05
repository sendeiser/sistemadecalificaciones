const { supabase, supabaseAdmin } = require('../config/supabaseClient');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization?.split(' ')[1];
    const queryToken = req.query.token;
    const token = authHeader || queryToken;

    if (!token) {
        return res.status(401).json({ error: 'Missing authorization token' });
    }

    try {
        // ALWAYS use standard supabase client to verify user JWT token via Supabase Auth
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error('Auth verification error:', error?.message);
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = user;
        req.token = token;
        req.supabase = supabaseAdmin || supabase;
        next();
    } catch (err) {
        console.error('Middleware error:', err);
        res.status(500).json({ error: 'Internal server error in auth middleware' });
    }
};

module.exports = authMiddleware;
