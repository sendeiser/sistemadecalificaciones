-- Fix invitation trigger with debugging and schema qualification
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
    RAISE LOG 'handle_new_user_with_invitation: Started for user %', NEW.email;

    invite_token_str := NEW.raw_user_meta_data->>'token';
    user_nombre := NEW.raw_user_meta_data->>'nombre';
    user_dni := NEW.raw_user_meta_data->>'dni';
    assigned_role := 'alumno'; 
    
    RAISE LOG 'Token received: %', invite_token_str;

    IF invite_token_str IS NOT NULL AND invite_token_str ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
        invite_token := invite_token_str::UUID;
        RAISE LOG 'Token cast to UUID: %', invite_token;
        
        SELECT * INTO invite_record FROM public.invitaciones WHERE token = invite_token;
        
        RAISE LOG 'Invite record found: %', invite_record.token;

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
        UPDATE public.invitaciones SET usado = true WHERE token = invite_token;
    ELSE
        RAISE LOG 'No valid token provided, skipping invitation check';
        -- For testing, we are allowing registration of 'alumno' if no token.
        -- But remember Register.jsx blocks UI.
    END IF;

    RAISE LOG 'Inserting profile with role: %', assigned_role;

    INSERT INTO public.perfiles (id, nombre, dni, rol, email)
    VALUES (
        NEW.id,
        COALESCE(user_nombre, 'Nuevo Usuario'),
        COALESCE(user_dni, ''),
        assigned_role::public.role_type,
        NEW.email
    );
    
    RAISE LOG 'Profile inserted successfully';
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user_with_invitation: %', SQLERRM;
    RAISE EXCEPTION 'Internal Error: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;
