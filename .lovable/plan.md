# Plan: Migración a cPanel (Node.js 18 + MySQL 8)

Dominio destino: **www.colegiopirineosdonbosco.com.ve**
Stack destino: **Node.js 18 + Express + MySQL 8 + almacenamiento de archivos en disco del hosting**

Importante: el proyecto actual seguirá viviendo en Lovable como entorno de desarrollo. Lo que voy a generar es un **paquete de despliegue independiente** (carpeta `/mnt/documents/cpanel-deploy/`) que vos subís a tu cPanel. El frontend React seguirá siendo el mismo, solo cambia a qué API le habla.

---

## Qué voy a entregar (archivos descargables)

### 1. Backend Node.js/Express (`/backend`)
- `server.js` — Express con CORS, rate-limit, helmet
- `db.js` — pool de conexiones MySQL2
- `auth.js` — JWT + bcrypt (reemplaza Supabase Auth)
- Rutas:
  - `POST /api/auth/login`, `/logout`, `/me`
  - `GET/POST/PUT/DELETE /api/authorities`
  - `GET/POST/PUT/DELETE /api/activities` + `/api/activities/:id/files`
  - `GET/POST/PUT/DELETE /api/weekly-tasks` + `/tasks/:id/files`
  - `POST /api/upload` (multer → guarda en `/uploads`, sirve estático)
- Middleware `requireAdmin` equivalente al `has_role` actual
- `.env.example` con DB_HOST, DB_USER, DB_PASS, DB_NAME, JWT_SECRET, UPLOAD_DIR

### 2. Esquema MySQL (`/sql/schema.sql`)
Tablas equivalentes a las actuales, adaptadas a MySQL 8:
- `users` (id CHAR(36), email, password_hash, created_at)
- `user_roles` (user_id, role ENUM('admin','user'))
- `authorities` (id, name, role, photo_url, display_order)
- `school_activities` (id, level, title, description, activity_date)
- `activity_files` (id, activity_id FK, file_name, file_path, file_size, mime_type)
- `weekly_tasks` (id, level, subject, week_start, week_end, task_description, attachment_url)
- `task_files` (id, task_id FK, file_name, file_path, file_size, mime_type)
- Índices en FKs y campos de orden

### 3. Script de migración de datos (`/sql/migrate-from-lovable.js`)
Script Node que:
1. Se conecta a Lovable Cloud (Supabase) con tus credenciales actuales
2. Descarga **todos los registros** de las 6 tablas
3. Descarga **todos los archivos** de los buckets `authority-photos` y `activity-files` a una carpeta local
4. Genera `data.sql` con INSERTs listos para cargar en MySQL
5. Genera carpeta `uploads/` lista para subir por FTP a tu cPanel

### 4. Frontend adaptado (`/frontend-patch`)
- Nuevo `src/lib/api.ts` — cliente fetch que reemplaza `supabase.from(...)` por llamadas REST a `/api/...`
- Nuevo `src/contexts/AuthContext.tsx` adaptado a JWT (token en httpOnly cookie)
- Reemplazos en componentes: `AuthoritiesSection`, `WeeklyTasksSection`, `SchoolActivitiesSection`, panel `/admin`
- `vite.config.ts` con proxy a `localhost:3001` para desarrollo
- Build → `dist/` se sube a `public_html/`

### 5. Guía de despliegue (`DEPLOY.md`)
Paso a paso con capturas conceptuales:
1. Crear base de datos MySQL en cPanel → anotar credenciales
2. Importar `schema.sql` con phpMyAdmin
3. Subir carpeta `backend/` por File Manager a `/home/usuario/api/`
4. cPanel → Setup Node.js App → crear app:
   - Node 18, Application root: `api`, Application URL: `api.colegiopirineosdonbosco.com.ve` (o `/api` en subdirectorio)
   - Startup file: `server.js`
   - Variables de entorno (las del `.env`)
5. Run NPM Install → Start App
6. Importar `data.sql` y subir `uploads/` por FTP
7. Build del frontend con `VITE_API_URL=https://www.colegiopirineosdonbosco.com.ve/api` → subir `dist/` a `public_html/`
8. Crear primer admin con script `npm run create-admin -- jogregar@gmail.com`
9. Configurar `.htaccess` para SPA routing y HTTPS

---

## Plan técnico clave

```text
cPanel (colegiopirineosdonbosco.com.ve)
├── public_html/           ← React build (estático)
│   ├── index.html
│   ├── assets/
│   └── .htaccess          ← SPA fallback + proxy /api
├── api/                   ← App Node.js (Setup Node.js App)
│   ├── server.js
│   ├── routes/
│   ├── uploads/           ← archivos subidos (servidos estáticos)
│   └── .env
└── MySQL database: colegio_db
```

Equivalencias funcionales:
| Lovable Cloud | cPanel |
|---|---|
| Supabase Auth | JWT + bcrypt + tabla `users` |
| RLS policies | Middleware `requireAdmin` en Express |
| `has_role()` función | JOIN con `user_roles` en login |
| Storage buckets públicos | Carpeta `/api/uploads` servida con `express.static` |
| URLs firmadas | URLs directas (archivos públicos como hoy) |
| `supabase.from('x').select()` | `fetch('/api/x')` |

---

## Lo que necesito de vos antes de empezar

1. **Las credenciales actuales de Lovable Cloud no las necesito** (las leo del proyecto para el script de migración).
2. Cuando tengas el hosting listo me confirmás:
   - Usuario y nombre exacto que cPanel asignó a la BD MySQL (suelen tener prefijo, ej: `colegio_db`, `colegio_user`)
   - Si vas a usar `/api` como subdirectorio o `api.tudominio.com` como subdominio
3. Los archivos de la migración los descargás de `/mnt/documents/` y los subís por FTP/File Manager.

---

## Tiempo estimado de mi parte
- Backend + schema: ~1 ciclo
- Script de migración + frontend adaptado: ~1 ciclo
- Guía y testing: ~1 ciclo

## Aviso honesto
A partir del despliegue, **vos sos responsable de**: backups de la BD (cPanel tiene cron jobs), renovar SSL si no es Let's Encrypt automático, mantener Node.js actualizado, y monitorear el espacio de `/uploads`. El proyecto en Lovable lo podés mantener como ambiente de desarrollo o pausar.

¿Apruebo el plan y arranco generando el paquete?
