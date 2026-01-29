-- Fix invitation trigger to safely handle UUID casting
CREATE OR REPLACE FUNCTION handle_new_user_with_invitation()
RETURNS TRIGGER AS $$
DECLARE
    invite_token_str TEXT;
    invite_token UUID;
    invite_record RECORD;
    assigned_role VARCHAR;
    user_nombre VARCHAR;
    user_dni VARCHAR;
BEGIN
    invite_token_str := NEW.raw_user_meta_data->>'token';
    user_nombre := NEW.raw_user_meta_data->>'nombre';
    user_dni := NEW.raw_user_meta_data->>'dni';
    assigned_role := 'alumno'; 

    -- Safely check if token string is valid UUID
    IF invite_token_str IS NOT NULL AND invite_token_str ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
        invite_token := invite_token_str::UUID;
        
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

        IF invite_record.email IS NOT NULL AND LOWER(invite_record.email) <> LOWER(NEW.email) THEN
            RAISE EXCEPTION 'Este token no corresponde a su dirección de correo electrónico';
        END IF;

        assigned_role := invite_record.rol;
        UPDATE invitaciones SET usado = true WHERE token = invite_token;
    ELSE
        -- If user attempts to register as docente/admin without token, BLOCK IT.
        -- We assume UI sends 'rol' in metadata, but we ignore it and use 'alumno' 
        -- UNLESS token is present.
    END IF;

    -- Create Profile with explicit role casting
    INSERT INTO public.perfiles (id, nombre, dni, rol, email)
    VALUES (
        NEW.id,
        COALESCE(user_nombre, 'Nuevo Usuario'),
        COALESCE(user_dni, ''),
        assigned_role::role_type,
        NEW.email
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
