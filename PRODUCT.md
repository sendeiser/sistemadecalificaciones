# Product

## Register

product

## Users

- **Administradores**: gestionan usuarios, configuración del sistema, auditoría, periodos académicos
- **Preceptores**: gestionan alumnos, materias, divisiones, asistencia, inscripciones
- **Docentes**: cargan notas y asistencia, consultan reportes de sus cursos
- **Alumnos**: consultan calificaciones, reportes, asistencias y logros personales
- **Tutores**: monitorean el progreso académico y justifican inasistencias de sus hijos

Usan la plataforma a diario durante el ciclo lectivo, desde computadoras de escritorio en la escuela y eventualmente desde dispositivos móviles. El contexto es institucional pero el ritmo es operativo: cargar notas entre clases, tomar asistencia en el aula, revisar alertas rápido.

## Product Purpose

CGB Portal es el sistema de gestión integral de la Escuela Comercio Gral. Belgrano. Centraliza calificaciones, asistencia, comunicaciones internas y administración académica en una plataforma única. Su éxito se mide en eficiencia operativa: reducir el tiempo que el personal docente y administrativo dedica a tareas burocráticas, y dar visibilidad instantánea del estado académico a toda la comunidad educativa.

## Brand Personality

**Institucional, moderna, profesional.**

- Voz clara y directa, no burocrática. Las etiquetas dicen exactamente lo que hacen.
- Comunicación en español rioplatense institucional. Sin traducciones literales, sin inglés innecesario.
- Transmite confianza y precisión. Un preceptor no debería dudar si la acción que va a tomar es la correcta.
- Moderna en ejecución, no en exceso decorativo. La calidad está en la tipografía, el espaciado, la respuesta inmediata, no en gradientes o animaciones superfluas.

## Anti-references

- **Nada genérico/SaaS.** Sin tarjetas con sombra suave y borde izquierdo de color como único elemento decorativo. Sin el patrón de icono + título + texto + enlace repetido ad infinitum. Sin gradientes de fondo, glassmorphism genérico, ni fondos con patrón de cuadrícula como default.
- No "dashboard genérico" con métricas que nadie usa. Cada número en pantalla debe responder a una decisión real del usuario.
- No formularios legacy interminables. Cada formulario debe tener la cantidad justa de campos para la tarea.

## Design Principles

1. **Claridad sobre ingenio.** Las herramientas institucionales no sorprenden. Cada etiqueta, estado y acción debe entenderse en medio segundo. Si hay que explicarlo, está mal diseñado.

2. **Progresión controlada.** La vista default muestra lo necesario para la tarea del momento. La profundidad (historial completo, configuraciones avanzadas) está a un click, no a simple vista. Un preceptor no necesita ver 50 campos cuando necesita 5.

3. **Adaptación por rol.** Cada pantalla cambia según quién la mira. La misma ruta puede mostrar herramientas distintas a un admin vs un docente. Esto no es personalización cosmética: es cambio de modelo mental.

4. **Consistencia institucional.** Los patrones de interacción (tablas, formularios, búsquedas) funcionan igual en todo el sistema. El usuario construye memoria muscular y no tiene que reaprender en cada módulo.

5. **Craft moderno, no decoración.** La calidad se siente en los detalles funcionales: transiciones rápidas, estados vacíos informativos, feedback inmediato a cada acción, tipografía legible, espaciado generoso. No en adornos visuales. Menos es más cuando cada elemento existente está bien resuelto.

## Accessibility & Inclusion

- WCAG AA como mínimo (contraste ≥4.5:1 texto normal, ≥3:1 texto grande)
- Navegación por teclado en todas las interfaces operativas (tablas de notas, grillas de asistencia)
- Modo de movimiento reducido: todas las animaciones deben degradar gracefulmente
- Contenido comprensible sin depender del color (estados, alertas, badges siempre tienen icono o texto además de color)
