# Plan de Tests E2E - Todos los Módulos CGB

## Credenciales
- Email: e2etest@cgb.edu.ar
- Pass: Test123456!

## Critical Points

### 1. Autenticación
- [ ] CP1: Login funciona y redirige a /dashboard
- [ ] CP2: Página pública (/ y /login) carga sin auth

### 2. Módulos del Sistema
- [ ] CP3: Dashboard (Panel de Control) se renderiza
- [ ] CP4: Calendario (Calendario Académico) se renderiza
- [ ] CP5: Mensajes (Mensajería Interna) se renderiza
- [ ] CP6: Anuncios se renderiza
- [ ] CP7: Alumnos (Gestión de Alumnos) se renderiza
- [ ] CP8: Materias (Gestión de Materias) se renderiza
- [ ] CP9: Divisiones (Gestión de Divisiones) se renderiza
- [ ] CP10: Asignaciones se renderiza
- [ ] CP11: Reportes se renderiza
- [ ] CP12: Usuarios/Invitaciones (Admin) se renderiza
- [ ] CP13: Ajustes se renderiza
- [ ] CP14: Ayuda se renderiza
- [ ] CP15: Auditoría se renderiza
- [ ] CP16: Config. Sistema se renderiza
- [ ] CP17: Inscribir Alumnos (Enrollment) se renderiza
- [ ] CP18: Periodos se renderiza

### 3. API Health
- [ ] CP19: Endpoint /api/health responde 200
- [ ] CP20: Endpoints protegidos rechazan sin token (401)

### 4. Toma General y Asistencia
- [ ] CP21: Toma General se renderiza
- [ ] CP22: Justificaciones se renderiza
- [ ] CP23: Reporte Asist. se renderiza
- [ ] CP24: Estadísticas de asistencia se renderiza

### 5. Mensajería
- [ ] CP25: Se puede enviar un mensaje a otro usuario
- [ ] CP26: Enviar mensaje sin contenido da error
