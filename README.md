# HydroLogistics ERP

**HydroLogistics ERP** es un sistema de gestión integral diseñado para administrar simultáneamente las operaciones de Punto de Venta (mostrador) y la logística de reparto (rutas de calle), manteniendo una estricta separación de dominios y control de acceso basado en roles.

> [!WARNING] Nota: Cualquier referencia a entidades comerciales de terceros (por ejemplo, clientes embotelladores o distribuidoras) corresponde únicamente a empresas autorizadas que operan instancias de este software, y no poseen derechos de propiedad sobre el código o el sistema.
<!-- Advertencia escrita por Gemini 3.1 PRO -->

## ⚖️ Modelo de Doble Licencia (Dual Licensing)

Este software, `HydroLogistics ERP`, es propiedad intelectual exclusiva de **Santiago Emanuel Mustafá Font** (Copyright © 2026).

Para proteger la integridad del código y ofrecer flexibilidad de uso, este proyecto se distribuye bajo un modelo de Doble Licencia:

**Licencia Comercial (Uso Privado / Empresarial):**
Cualquier entidad, empresa o individuo que desee utilizar, modificar o distribuir este software en un entorno **comercial**, **privado** o **de producción cerrado** (sin liberar su código fuente modificado al público), debe adquirir una licencia comercial propietaria. Para consultas comerciales, contactar directamente al autor.

**Licencia Open Source (GNU AGPLv3):**
Si estás desarrollando un proyecto de código abierto, evaluando el código con fines educativos, o revisando mi portafolio, eres libre de descargar, compilar y leer este código.
Bajo esta licencia, cualquier modificación o trabajo derivado que interactúe con usuarios a través de una red (SaaS) debe publicarse de manera gratuita y bajo los mismos términos exactos de la licencia **`GNU AGPLv3`**.

***El uso de este software implica la aceptación explícita de uno de estos dos términos.***

## 🚀 Arquitectura y Dominios

El sistema está diseñado bajo el principio de Separación de Preocupaciones (`Separation of Concerns`). Se divide en dos dominios operativos principales que interactúan solo en los puntos financieros (rendiciones):

### Dominio de Mostrador (POS)

- Dependiente de sesiones contables (Cajas)

- Protegido por **ShiftGuard**: Ninguna operación de venta directa o visualización de historial puede realizarse sin un turno abierto con su respectivo fondo de caja.

### Dominio de Logística (Rutas)

- **Independiente de las cajas**. Permite a los choferes (Drivers) gestionar su carga, inventario rodante y rutas desde temprano, sin depender del horario de apertura del mostrador.

- Las rendiciones de ruta interactúan con la caja central **solo en el momento de la confirmación financiera** (/settlement).

## 🛠️ Stack Tecnológico

Frontend

- Core: **React 18, Vite, TypeScript**.

- Enrutamiento: **React Router v7**.

- Estado Global: **Zustand**.

- Estilos: **Tailwind CSS**.

- Fechas y Zonas Horarias: **Luxon** (Estandarizado a America/Argentina/Buenos_Aires).
  
- Visualización: **Recharts**, **@react-pdf/renderer**, **Lucide React**.

Backend:

- Core: **Node.js, Express**.
  
- Base de Datos: SQLite (**Turso**).
  
- ORM: **Drizzle ORM**.

- Manejo de Fechas: **Luxon** (Sincronización estricta de husos horarios entre el cliente y el servidor).

## 👥 Control de Acceso basado en Roles (RBAC)

El sistema soporta múltiples perfiles, restringidos mediante AuthGuard:

- **ADMIN**: Acceso total, dashboard financiero, gestión de empleados y reportes de caja históricos.

- **EMPLOYEE**: Acceso restringido al Punto de Venta (POS) y visualización del historial de ventas actual.

- **DRIVER**: Acceso exclusivo al módulo de Logística. Solo puede ver sus rutas asignadas, gestionar su carga y realizar peticiones de cierre.

## ⚙️ Instalación y Configuración Local

### Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd hydrologistics-erp
```

### Configurar el Backend

```bash
cd server
npm install
```

### Crea un archivo .env en el directorio server con las siguientes variables

```plaintext
DATABASE_URL=turso_database_url
DATABASE_AUTH_TOKEN=turso_auth_token
PORT=3000
```

### Ejecutar migraciones y levantar el servidor

```bash
npm run db:push
npm run dev
```

### Configurar el Frontend

```bash
cd client
npm install
```

### Crea un archivo .env en el directorio client

```plaintext
VITE_API_URL=<http://localhost:3000/api>
```

### Levantar el entorno de desarrollo

```bash
npm run dev
```

## 📅 Estandarización de Fechas

Para evitar problemas de desfase horario (el clásico "las ventas aparecen al día siguiente"), el sistema utiliza Luxon de manera integral. Toda la ingesta de fechas en el frontend se convierte a formato ISO con el offset local explícito antes de enviarse al backend. El backend fuerza la zona America/Argentina/Buenos_Aires para los cálculos de inicio/fin de día en consultas a la base de datos.

## 🤝 Flujo de Rendición de Rutas

1. El Chofer solicita el cierre de stock, devolviendo la mercadería no vendida.

2. El sistema calcula la deuda total basada en el esquema de precios asignado a esa ruta.

3. El Administrador o Manager aplica deducciones (Boletas, Transferencias, Cambio físico).

4. El sistema calcula las compensaciones y arroja el monto en efectivo exacto a recibir.

5. Al confirmar, el dinero ingresa automáticamente a la Caja Abierta (Shift) como un movimiento de entrada trazable.
