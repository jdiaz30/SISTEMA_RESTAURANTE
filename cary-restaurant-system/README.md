# Sistema de Gestión para Restaurante Cary

Sistema completo de gestión para restaurantes desarrollado con Node.js, Express, React y PostgreSQL.

## Características Principales

- **Gestión de Mesas**: Control de estados (libre, ocupada, reservada) organizadas por áreas (Salón Principal, Terraza, VIP)
- **Reservas**: Sistema de reservas con asignación manual de mesas, confirmación por email y seguimiento de estados
- **Pedidos**: Toma de pedidos con posiciones personalizadas, consolidación automática y gestión de items
- **Facturación**: Generación de facturas con soporte para pagos divididos personalizados
- **Productos**: Administración de menú con categorías y paginación
- **Dashboard**: Estadísticas en tiempo real de ventas, mesas y métricas del día
- **Autenticación**: Sistema de login seguro con JWT y roles (admin/mesero)
- **Reservas Públicas**: Página web pública para que clientes hagan reservas con confirmación por email

## Funcionalidades Destacadas

### Gestión Inteligente de Mesas
- **Cambios automáticos de estado**:
  - Reserva confirmada → Mesa "reservada"
  - Cliente llega y se crea pedido → Mesa "ocupada"
  - Factura pagada → Mesa "libre"
- **Cambios manuales**: Para atender walk-ins (clientes sin reserva)
- **Vista por áreas**: Visualización agrupada de mesas por zona del restaurante

### Sistema de Pedidos Avanzado
- **Consolidación automática**: Múltiples items se agregan al mismo pedido activo
- **Posiciones por comensal**: Organizar pedido por cada persona en la mesa
- **Eliminar items**: Corrección de errores al eliminar items del pedido
- **Paginación**: Navegación fácil con 8 productos por página

### Reservas Completas
- **Asignación manual de mesas**: Control total del staff sobre qué mesa asignar
- **Notificaciones por email**: Confirmación automática vía EmailJS
- **Códigos únicos**: Cada reserva tiene un código para verificación
- **Paginación**: 5 reservas por página con indicadores de total
- **Filtros avanzados**: Por fecha, estado y búsqueda por nombre/teléfono/código

### Facturación Flexible
- **Pagos divididos personalizados**:
  - División equitativa entre N personas
  - Selección manual de productos por cliente
  - Monto personalizado
  - Combinación de métodos de pago (efectivo, tarjeta, transferencia)
- **Impresión de facturas**: Vista optimizada para imprimir

## Requisitos Previos

- Node.js v20 o superior
- PostgreSQL 14 o superior
- npm v10 o superior

## Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/cary-restaurant-system.git
cd cary-restaurant-system
```

### 2. Configurar Base de Datos

Crear una base de datos PostgreSQL:

```sql
CREATE DATABASE restaurante_cary;
```

Ejecutar los scripts de base de datos:

```bash
psql -U postgres -d restaurante_cary -f database/schema.sql
psql -U postgres -d restaurante_cary -f database/migration_add_factura_pagos.sql
psql -U postgres -d restaurante_cary -f database/migration_add_posiciones.sql
```

**Opcional - Limpiar datos de prueba:**

```bash
# Para eliminar solo transacciones (mantiene productos, mesas, áreas)
psql -U postgres -d restaurante_cary -f database/limpiar_data_prueba.sql

# Para eliminar TODO (excepto usuarios)
psql -U postgres -d restaurante_cary -f database/limpiar_todo_completo.sql
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
VITE_EMAILJS_SERVICE_ID=tu_service_id
VITE_EMAILJS_TEMPLATE_ID=tu_template_id
VITE_EMAILJS_PUBLIC_KEY=tu_public_key
```

**Nota sobre EmailJS**: El sistema usa EmailJS para enviar confirmaciones de reservas. Si no configuras estas variables, el sistema funcionará pero no enviará emails. Para configurarlo:

1. Crea una cuenta en [EmailJS](https://www.emailjs.com/)
2. Configura un servicio de email (Gmail recomendado)
3. Crea un template con las variables: `cliente_nombre`, `fecha`, `hora`, `num_personas`, `codigo_reserva`
4. Copia tus credenciales al `.env`

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
│   │   └── database.js          # Configuración de PostgreSQL
│   ├── middleware/
│   │   └── auth.js               # Middleware de autenticación JWT
│   ├── routes/
│   │   ├── auth.js               # Login y autenticación
│   │   ├── dashboard.js          # Estadísticas y métricas
│   │   ├── facturas.js           # Facturación y pagos
│   │   ├── mesas.js              # Gestión de mesas y áreas
│   │   ├── pedidos.js            # Pedidos con consolidación
│   │   ├── productos.js          # Productos y categorías
│   │   └── reservas.js           # Reservas con asignación manual
│   ├── .env
│   ├── index.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ErrorBoundary.jsx # Manejo global de errores
│   │   │   └── Layout.jsx        # Layout principal con navegación
│   │   ├── config/
│   │   │   └── emailjs.js        # Configuración de EmailJS
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Página principal con estadísticas
│   │   │   ├── Mesas.jsx         # Gestión de mesas por área
│   │   │   ├── Reservas.jsx      # Gestión de reservas con paginación
│   │   │   ├── Pedidos.jsx       # Toma de pedidos con paginación
│   │   │   ├── Facturacion.jsx   # Facturación con pagos divididos
│   │   │   ├── Productos.jsx     # Administración de productos
│   │   │   ├── ReservarPublico.jsx   # Página pública de reservas
│   │   │   ├── VerificarReserva.jsx  # Verificación de código
│   │   │   └── ImprimirFactura.jsx   # Vista de impresión
│   │   ├── services/
│   │   │   ├── api.js            # Configuración de Axios
│   │   │   └── emailService.js   # Servicio de emails
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   └── package.json
└── database/
    ├── schema.sql                     # Esquema inicial de BD
    ├── migration_add_factura_pagos.sql    # Migración de pagos
    ├── migration_add_posiciones.sql       # Migración de posiciones
    ├── limpiar_data_prueba.sql           # Limpiar transacciones
    └── limpiar_todo_completo.sql         # Limpiar todo
```

## Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos relacional
- **JWT** - Autenticación mediante tokens
- **bcryptjs** - Encriptación de contraseñas

### Frontend
- **React 18** - Librería de UI
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework de estilos
- **Axios** - Cliente HTTP
- **React Router DOM** - Enrutamiento
- **EmailJS** - Envío de emails desde el navegador

## Flujo de Trabajo del Sistema

### 1. Reservas (Flujo Completo)

```
Cliente web → Llena formulario → Sistema crea reserva → Email de confirmación
                                        ↓
Staff en dashboard → Asigna mesa manualmente → Confirma reserva
                                        ↓
Mesa cambia a "reservada" → Cliente llega → Staff crea pedido
                                        ↓
Mesa cambia a "ocupada" automáticamente
```

### 2. Walk-ins (Sin Reserva)

```
Cliente llega → Staff cambia mesa a "ocupada" manualmente → Crea pedido
```

### 3. Pedidos

```
Mesero selecciona mesa → Agrega productos al carrito → Envía a cocina
                                        ↓
Si existe pedido activo → Items se agregan automáticamente
Si no existe → Se crea nuevo pedido
                                        ↓
Cocina cambia estado: pendiente → preparando → listo
```

### 4. Facturación

```
Mesa con pedido listo → Facturación → Elige tipo de pago:
                                        ↓
├─ Pago completo → 1 factura → Mesa libre
├─ Dividir equitativo → N facturas iguales
├─ Dividir por items → Seleccionar productos por persona
└─ Monto personalizado → Especificar cantidad exacta
```

## Manejo de Errores

El sistema incluye **ErrorBoundary** en React que captura errores globales y muestra una página amigable con opciones de:
- Recargar la página
- Volver al Dashboard
- Ver detalles técnicos (solo en desarrollo)

## Resolución de Problemas

### Error de conexión a la base de datos
Verificar que PostgreSQL esté ejecutándose y las credenciales en `.env` sean correctas.

```bash
# Verificar estado de PostgreSQL
sudo systemctl status postgresql

# Reiniciar si es necesario
sudo systemctl restart postgresql
```

### Puerto en uso
Cambiar el puerto en el archivo `.env` del backend si el puerto 5000 está ocupado.

### Error en npm install
Eliminar `node_modules` y `package-lock.json`, luego ejecutar `npm install` nuevamente:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Emails no se envían
Verificar que las variables de EmailJS estén correctamente configuradas en `frontend/.env`. El sistema funcionará sin emails pero no enviará confirmaciones.

### Migraciones no aplicadas
Si hay errores relacionados con columnas faltantes, asegúrate de ejecutar todas las migraciones:

```bash
psql -U postgres -d restaurante_cary -f database/migration_add_factura_pagos.sql
psql -U postgres -d restaurante_cary -f database/migration_add_posiciones.sql
```

## Características de Seguridad

- **Autenticación JWT**: Tokens seguros con expiración
- **Contraseñas encriptadas**: Usando bcryptjs con salt
- **Variables de entorno**: Credenciales sensibles en `.env`
- **Validación de roles**: Middleware de autenticación en todas las rutas protegidas
- **SQL parametrizado**: Prevención de inyección SQL

## Mejoras Futuras

- [ ] Reportes avanzados con gráficas
- [ ] Notificaciones push para cocina
- [ ] App móvil para meseros
- [ ] Sistema de propinas
- [ ] Integración con POS físicos
- [ ] Multi-restaurante (franquicias)

## Autor

Sistema desarrollado para gestión integral de Restaurante Cary.

## Licencia

Este proyecto es de uso privado para fines comerciales del Restaurante Cary.
