# Gestor de correos Gmail

Limpia la bandeja de entrada sin tener el PC encendido: manda a la papelera los correos molestos y avisa cuando llega uno importante.

Los molestos **no se borran para siempre**. Van a la papelera de Gmail y se pueden recuperar unos 30 días.

## Privacidad

Este repositorio **no debe incluir** tu correo personal, contraseñas ni credenciales de Google.

- Las notificaciones salen hacia la cuenta de Gmail ya conectada, no hacia un correo escrito en el código.
- Si exportas un flujo de n8n, deja el destinatario como `YOUR_EMAIL@gmail.com`.
- No subas archivos `credentials.json`, `token.json` ni `.env`.

## Cómo funciona

Cada 6 horas, una automatización de Cursor (en la nube, modelo Composer 2.5) hace esto:

1. Revisa correos recientes de la cuenta de Gmail conectada.
2. Si el remitente está en `senders.json` → `unwanted`, lo manda a la papelera.
3. Si el remitente está en `senders.json` → `important`, lo deja en la bandeja y lo incluye en el aviso.
4. Envía un resumen: qué se tiró y qué hay que revisar.

## Listas de remitentes

Edita `senders.json` para añadir o quitar direcciones. No hace falta tocar nada más.

**Molestos:** Spotify, Computrabajo, Humand, YouTube, Fondex, Adobe, Lovable, Temu, Lucid, Davivienda, PayPal.

**Importantes:** Platzi, LinkedIn.

## Requisitos

- Cuenta de Cursor con el plugin de Gmail instalado y autorizado.
- Automatización activa en Cursor (horario: cada 6 horas).
- Este repositorio en GitHub, para que la automatización lea `senders.json`.

## Respaldo n8n

`Limpieza automática Gmail.json` es el flujo original de n8n, por si quieres importarlo en n8n Cloud. Es opcional: el camino principal ya no depende de tener n8n en el PC.

Si lo importas:

1. Conecta tu propia credencial de Gmail en n8n.
2. Cambia `YOUR_EMAIL@gmail.com` por tu correo **solo dentro de n8n**, no en el archivo del repo.
3. Activa el workflow en n8n Cloud, no en local.

Alcance de Google recomendado: `https://www.googleapis.com/auth/gmail.modify`.
