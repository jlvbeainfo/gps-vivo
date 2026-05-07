# Bot de Telegram para GPS (VPS)

Este pequeño script se encarga de monitorear constantemente la API de Owntracks y calcular si los dispositivos han entrado o salido de las geozonas definidas. Cuando detecta un cambio, te envía una notificación directamente a tu celular mediante Telegram.

## Requisitos Previos

1. Un Bot de Telegram. Si no lo tienes:
   - Abre Telegram y busca a `@BotFather`.
   - Escríbele `/newbot` y sigue los pasos.
   - Te dará un **Token** que se ve parecido a `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`.
2. Tu **Chat ID** de Telegram:
   - Busca a `@userinfobot` en Telegram y mándale un mensaje. Te responderá con un número (tu Chat ID).

## Instalación en tu VPS (con Docker)

1. Sube esta carpeta completa (`vps-bot`) a tu VPS (por ejemplo, al lado de la carpeta donde tienes tu Owntracks).
2. Entra a la carpeta:
   ```bash
   cd vps-bot
   ```
3. Crea tu archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```
4. Edita el archivo `.env` y pega tu Token y tu Chat ID:
   ```bash
   nano .env
   ```
5. Levanta el contenedor con Docker Compose:
   ```bash
   docker-compose up -d --build
   ```

¡Y listo! El bot estará funcionando 24/7. Puedes ver los logs para asegurarte de que está leyendo bien:
```bash
docker logs -f vps-bot-gps
```

## Nota sobre las Geozonas
Si agregas nuevas geozonas en el frontend (`App.jsx`), recuerda agregarlas también en el archivo `index.js` de este bot para que te notifique de ellas.
