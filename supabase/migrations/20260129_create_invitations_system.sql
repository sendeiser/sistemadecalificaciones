-- Phase 17: Secure Invitation System
-- Migration: create_invitations_system

-- =====================================================
-- INVITATIONS TABLE
-- =====================================================
CREATE TABLE invitaciones (
    token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('docente', 'preceptor', 'admin')),
    email VARCHAR(255), -- Optional: restrict usage to this email
    usado BOOLEAN DEFAULT false,
    creado_por UUID REFERENCES auth.users(id),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY - INVITACIONES
-- =====================================================
ALTER TABLE invitaciones ENABLE ROW LEVEL SECURITY;

-- Only Admins (Preceptors) can view/create invitations
-- Note: 'preceptor' in perfiles acts as Admin in this system context
CREATE POLICY "Admins can manage invitations"
    ON invitaciones
    USING (
        EXISTS (
            SELECT 1 FROM perfiles 
            WHERE id = auth.uid() 
            AND rol IN ('admin', 'preceptor')
        )
    );

-- =====================================================
-- SECURE USER CREATION TRIGGER
-- =====================================================
-- This function replaces any basic flow that trusts client metadata for roles.
CREATE OR REPLACE FUNCTION handle_new_user_with_invitation()
RETURNS TRIGGER AS $$
DECLARE
    invite_token UUID;
    invite_record RECORD;
    assigned_role VARCHAR;
    user_nombre VARCHAR;
    user_dni VARCHAR;
BEGIN
    -- Extract metadata
    invite_token := (NEW.raw_user_meta_data->>'token')::UUID;
    user_nombre := NEW.raw_user_meta_data->>'nombre';
    user_dni := NEW.raw_user_meta_data->>'dni';

    -- Default role if no invitation (e.g. Students if open registration allowed)
    -- For security, if you want only invited users, raise exception here instead.
    assigned_role := 'alumno'; 

    -- Validate Token if present
    IF invite_token IS NOT NULL THEN
        SELECT * INTO invite_record FROM invitaciones WHERE token = invite_token;

        IF invite_record.token IS NULL THEN
            RAISE EXCEPTION 'Token de invitación inválido';
        END IF;

        IF invite_record.usado = true THEN
            RAISE EXCEPTION 'Este token de invitación ya fue utilizado';
        END IF;
        
        IF invite_record.expires_at < NOW() THEN
            RAISE EXCEPTION 'El token de invitación ha expirado';
        END IF;

        -- Check email match if specified
        IF invite_record.email IS NOT NULL AND LOWER(invite_record.email) <> LOWER(NEW.email) THEN
            RAISE EXCEPTION 'Este token no corresponde a su dirección de correo electrónico';
        END IF;

        -- Assign Role from Invitation
        assigned_role := invite_record.rol;

        -- Mark as Used
        UPDATE invitaciones SET usado = true WHERE token = invite_token;
    ELSE
        -- If user attempts to register as docente/admin without token, BLOCK IT.
        -- We assume UI sends 'rol' in metadata, but we ignore it and use 'alumno' 
        -- UNLESS token is present.
        -- Optional: If you want to completely block public registration:
        -- RAISE EXCEPTION 'Registro público cerrado. Se requiere invitación.';
    END IF;

    -- Create Profile
    INSERT INTO public.perfiles (id, nombre, dni, rol, email)
    VALUES (
        NEW.id,
        COALESCE(user_nombre, 'Nuevo Usuario'),
        COALESCE(user_dni, ''),
        assigned_role,
        NEW.email
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger checks
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_with_invitation();
