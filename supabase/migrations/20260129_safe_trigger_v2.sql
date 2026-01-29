-- Safer trigger to prevent rollback
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
    -- Logging
    RAISE LOG 'Trigger STARTED for: %', NEW.email;

    invite_token_str := NEW.raw_user_meta_data->>'token';
    user_nombre := NEW.raw_user_meta_data->>'nombre';
    user_dni := NEW.raw_user_meta_data->>'dni';
    assigned_role := 'alumno';

    -- Validate Token
    IF invite_token_str IS NOT NULL AND invite_token_str ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
        invite_token := invite_token_str::UUID;
        
        -- Use public schema explicitly
        SELECT * INTO invite_record FROM public.invitaciones WHERE token = invite_token;

        IF invite_record.token IS NULL THEN
            RAISE EXCEPTION 'Token de invitación inválido';
        END IF;
        
        IF invite_record.usado = true THEN
            RAISE EXCEPTION 'Token de invitación ya utilizado';
        END IF;

        assigned_role := invite_record.rol;
        
        -- Mark used
        UPDATE public.invitaciones SET usado = true WHERE token = invite_token;
    END IF;

    -- Insert Profile
    -- Using explicit schema and casting
    INSERT INTO public.perfiles (id, nombre, dni, rol, email)
    VALUES (
        NEW.id,
        COALESCE(user_nombre, 'Nuevo Usuario'),
        COALESCE(user_dni, ''),
        assigned_role::public.role_type,
        NEW.email
    );

    RAISE LOG 'Trigger SUCCESS';
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Capture error, log it, and re-raise to ensure transaction aborts if needed, 
    -- but provide clear message.
    RAISE LOG 'Trigger FAILED: %', SQLERRM;
    RAISE EXCEPTION 'Registration Failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;
