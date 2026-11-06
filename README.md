# Series · Catálogo

Aplicación web en español para administrar un catálogo de series, plataformas y valoraciones. Está hecha con Next.js y Supabase; puede ejecutarse localmente y desplegarse en Vercel.

## Funcionalidades

- CRUD de plataformas.
- CRUD de series asociadas a una plataforma.
- CRUD de valoraciones asociadas a una plataforma y serie, con puntaje de 1 a 10 y observación.
- Validación de relaciones en la base de datos para impedir que una valoración asocie una serie a una plataforma distinta.

## Configuración local

1. Crea un proyecto en [Supabase](https://supabase.com/).
2. En Supabase, abre **SQL Editor**, copia y ejecuta [`supabase/schema.sql`](./supabase/schema.sql).
3. Copia `.env.example` como `.env.local` y completa la URL del proyecto y la clave pública `publishable` (o la antigua `anon`) desde **Project Settings → API Keys**. No uses una clave `secret`/`service_role` en una variable `NEXT_PUBLIC_*`.
4. Instala dependencias e inicia el servidor:

   ```bash
   npm install
   npm run dev
   ```

5. Abre <http://localhost:3000>.

## Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. En **Settings → Environment Variables**, agrega `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` con la URL del proyecto y su clave pública `publishable` (o la antigua `anon`).
3. Despliega la aplicación.

El esquema debe estar creado en Supabase antes de usar la aplicación.

## Acceso a los datos

La versión solicitada no requiere inicio de sesión. El esquema configura políticas RLS que permiten a cualquier visitante con acceso al sitio leer, crear, editar y eliminar registros. La clave `anon` está diseñada para ser pública; **las políticas abiertas también hacen públicas las operaciones de escritura y borrado**. No guardes información sensible en este catálogo. Antes de usarlo con datos privados o restringir quién puede modificarlo, reemplaza esas políticas por autenticación y permisos adecuados.
