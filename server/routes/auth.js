const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// Endpoint to verify token and get user profile
router.post('/login', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    // Get User from Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return res.status(401).json({ error: error ? error.message : 'Invalid token' });
    }

    // Fetch additional profile info from 'perfiles' table
    const { data: profile, error: profileError } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError) {
        console.error('Profile fetch error:', profileError);
        // Depending on logic, might want to fail or just return user without profile
        return res.status(500).json({ error: 'Error fetching user profile' });
    }

    res.json({ user, profile });
});

module.exports = router;
