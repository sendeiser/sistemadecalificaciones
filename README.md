# Sistema de Gestión de Calificaciones

## Configuración Rápida

### 1. Base de Datos (Supabase)
1. Crea un proyecto en [Supabase](https://supabase.com).
2. Copia el contenido del archivo `schema.sql` y ejecútalo en el Editor SQL de Supabase.
3. Inserta usuarios de prueba en la tabla `auth.users` y `perfiles` (ver `schema.sql` para estructura).

### 2. Configurar Variables de Entorno
Edita los siguientes archivos con tus credenciales de Supabase:
- `server/.env`
- `client/.env`

### 3. Ejecutar la Aplicación

**Backend (Servidor):**
```bash
cd server
npm start
```

**Frontend (Cliente):**
```bash
cd client
npm run dev
```

Abre el navegador en http://localhost:5173
