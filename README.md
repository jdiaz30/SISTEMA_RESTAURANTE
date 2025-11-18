# Sistema de Gestión para Restaurante Cary

Sistema completo de gestión para restaurantes desarrollado con Node.js, Express, React y PostgreSQL.

## Características

- **Gestión de Mesas**: Control de estados (libre, ocupada, reservada) por áreas
- **Reservas**: Sistema de reservas con confirmación y seguimiento
- **Pedidos**: Toma de pedidos con seguimiento de estados
- **Facturación**: Generación de facturas con soporte para pagos divididos personalizados
- **Productos**: Administración de menú y categorías
- **Dashboard**: Estadísticas de ventas y métricas del día
- **Autenticación**: Sistema de login con roles (admin/mesero)

## Requisitos Previos

- Node.js v20 o superior
- PostgreSQL 14 o superior
- npm v10 o superior

## Instalación

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd cary-restaurant-system
```

### 2. Configurar Base de Datos

Crear una base de datos PostgreSQL:

```sql
CREATE DATABASE restaurante_cary;
```

Ejecutar el script de base de datos:

```bash
psql -U postgres -d restaurante_cary -f database/schema.sql
psql -U postgres -d restaurante_cary -f database/migration_add_factura_pagos.sql
```

### 3. Configurar Backend

```bash
cd backend
npm install
```

Crear archivo `.env` en la carpeta `backend`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=restaurante_cary
JWT_SECRET=tu_clave_secreta_segura
NODE_ENV=development
```

### 4. Configurar Frontend

```bash
cd ../frontend
npm install
```

Crear archivo `.env` en la carpeta `frontend`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Ejecutar el Proyecto

### Iniciar Backend

```bash
cd backend
npm start
```

El servidor estará disponible en `http://localhost:5000`

### Iniciar Frontend

En otra terminal:

```bash
cd frontend
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Credenciales por Defecto

Usuario administrador:
- **Email**: admin@cary.com
- **Password**: admin123

Usuario mesero:
- **Email**: mesero@cary.com
- **Password**: mesero123

## Estructura del Proyecto

```
cary-restaurant-system/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── facturas.js
│   │   ├── mesas.js
│   │   ├── pedidos.js
│   │   ├── productos.js
│   │   └── reservas.js
│   ├── .env
│   ├── index.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   └── package.json
└── database/
    ├── schema.sql
    └── migration_add_factura_pagos.sql
```

## Tecnologías Utilizadas

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT (autenticación)
- bcryptjs (encriptación)

### Frontend
- React
- Vite
- Tailwind CSS
- Axios
- React Router DOM

## Funcionalidades Principales

### Flujo de Trabajo

1. **Reservas**: Cliente reserva → Staff confirma → Cliente llega → Mesa pasa a ocupada
2. **Pedidos**: Seleccionar mesa → Agregar productos → Enviar a cocina
3. **Facturación**: Seleccionar mesa → Elegir tipo de pago → Generar factura → Imprimir

### Pagos Divididos

El sistema permite dividir pagos de forma personalizada:
- División equitativa entre N personas
- Selección manual de productos por cliente
- Monto personalizado
- Combinación de métodos de pago

## Resolución de Problemas

### Error de conexión a la base de datos
Verificar que PostgreSQL esté ejecutándose y las credenciales en `.env` sean correctas.

### Puerto en uso
Cambiar el puerto en el archivo `.env` del backend si el puerto 5000 está ocupado.

### Error en npm install
Eliminar `node_modules` y `package-lock.json`, luego ejecutar `npm install` nuevamente.

## Autor

Proyecto desarrollado para gestión de restaurante.

## Licencia

Este proyecto es de uso académico/privado.
