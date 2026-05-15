GESTOR DE CORREOS GMAIL

Un proyecto creado en n8n, en el que automaticamente puedo eliminar los correos molestos o inecesarios y gestionar mis correos más importantes, además puedo recibir las
notificaciones de cuando se han eliminado ciertos correos molestos, y cuando tengo correos importantes por recibir.

PASOS ESENCIALES PARA EMPEZAR

- tener n8n instalado o n8n cloud
- Conectar Gmail a n8n (Para que n8n pueda acceder a tu Gmail, necesitas crear un proyecto en Google Cloud Console y obtener credenciales OAuth2).
- (En mi caso lo estoy usando en la terminal de mi PC)
- Cuando lo tengas instalado en el PC, solo debes ingresar a la consola (WINDOWS + R)
- Luego escribir el comando (n8n start)

PASOS EN GOOGLE CLOUD:

Ve a console.cloud.google.com
Haz clic en el selector de proyectos "Nuevo proyecto"
Ponle un nombre, por ejemplo: n8n-gmail o Gestor de Correos Gmail, como prefieras
Haz clic en Crear.

PASOS PARA LA APIs:

En el menú lateral ve a "APIs y servicios" y busca "Biblioteca"
Busca "Gmail API"
Haz clic en ella y luego en "Habilitar"

PASOS PARA CREAR CREDENCIALES GOOGLE CLOUD:

Ve a "APIs y servicios" luego a "Credenciales"
Clic en "+ Crear credenciales" luego a "ID de cliente OAuth"
Si te pide configurar la pantalla de consentimiento, haz clic en "Configurar pantalla de consentimiento":

Tipo de usuario: Externo
Llena nombre de la app (ej: n8n), tu correo de soporte y correo del desarrollador
Guarda y continúa (las demás secciones puedes dejarlas por defecto)

De vuelta en credenciales, selecciona tipo de aplicación: "Aplicación web"
En "URIs de redireccionamiento autorizados" agrega:

http://localhost:5678/rest/oauth2-credential/callback
(Este es el localhost base en donde se ejecuta n8n)

AGREGA CREDENCIALES EN N8N:

Abre n8n y ve a "Credentials" en el menú lateral
Clic en "+ Add credential" y busca "Google OAuth2 API"
Pega tu Client ID y Client Secret
Haz clic en "Sign in with Google" y autoriza el acceso a tu cuenta Gmail

RECOMENDACIÓN:
(DESCARGA LOS CREDENCIALES EN UN ARCHIVO TIPO .TXT PARA NO PERDERLOS)

DATO IMPORTANTE:
cuando estés rellenando el campo alcance, puedes usar el siguiente enlace:
https://www.googleapis.com/auth/gmail.modify

COMO ESTÁS EN MODO DE PRUEBA DEBERÁS AGREGARTE COMO USUARIO DE PRUEBA, lo consigues de la siguiente manera:

Ve a console.cloud.google.com
En el menú lateral ve a "APIs y servicios" luego a "Pantalla de consentimiento de OAuth"
Baja hasta la sección "Usuarios de prueba"
Haz clic en "+ Add users"
Agrega tu correo: pepitoposo@gmail.com
Haz clic en "Guardar"

Luego vuelve a n8n e intenta conectar de nuevo con "Sign in with Google"

PARA LA SIGUIENTE YA EMPEZAMOS A METERNOS DE LLENO EN n8n, AQUÍ EMPEZAMOS A CREAR EL FLUJO BASE

En n8n haz clic en "+ New Workflow" (arriba a la derecha o en el menú principal)
Haz clic en el nombre por defecto arriba y renómbralo: Limpieza automática Gmail (EN MI CASO "LIMPIEZA AUTOMÁTICA GMAIL")

AGREGAMOS EL NODO TRIGGER DE GMAIL

Haz clic en el "+" del canvas para agregar un nodo
Busca Gmail Trigger y selecciónalo
En la configuración del nodo ajusta los siguientes campos:


Campo                    Valor
Credential               La que acabas de crear
Resource                 Message
Event                    MessageReceived
Poll Times               Every all (puedes ajustarlo)

GUARDALO

HORA DE PROBAR EL PRIMER TRIGGER

Haz clic en "Test step" (o "Execute Node")
Debería traerte algunos correos recientes de tu bandeja como resultado
Si ves correos en el panel de resultados (TIENEN QUE SALTARTE CORREOS).

AGREGAR NODO IF

Haz clic en el "+" después del nodo Gmail Trigger
Busca IF y selecciónalo
Renombra el nodo como Filtro Molestos (COMO LO PREFIERAS)

HAY QUE CONFIGURAR LAS CONDICIONES:

Dentro del nodo IF configura así:

Combine → OR

Campo                 Valor
Value 1               {{ $json.From }}
Operation             Contains (CONTIENE)
Value 2               el correo del remitente

AHORA A ELIMINAR LOS CORREOS MOLESTOS
Vamos a agregar el nodo que manda a la papelera todos los correos que salgan por la Rama Verdadera.

VOLVEMOS A AGREGAR EL NODO DE GMAIL

Haz clic en el "+" que sale de la Rama Verdadera del nodo Filtros molestos
Busca Gmail y selecciónalo
Renombra el nodo como: Eliminar molestos (O COMO PREFIERAS)

CONFIGURAMOS EL NUEVO NODO DE GMAIL

Dentro del nodo ajusta estos campos:

Campo                     Valor
Credential                La que creaste al inicio
Resource                  Message
Operation                 Delete
Message ID                {{ $json.id }}

EJECUTA EL NODO PARA VER SI FUNCIONA

AHORA AGREGAMOS OTRO NODO IF

Haz clic en el "+" que sale de la Rama Falsa del nodo Filtros molestos
Busca IF y selecciónalo
Renombra el nodo como Filtro Importantes

COFIGURAR DE NUEVO LAS CONDICIONES DEL NUEVO NODO IF

Dentro del nodo IF configura así:

Combine → OR

Campo                   Valor
Value 1                 {{ $json.From }}
Operation               Contains (CONTIENE)
Value 2                 el correo del remitente

NO OLVIDES PROBAR QUE FUNCIONE

NOTIFICACION POR GMAIL

Ahora a agregar dos nodos de notificación: uno que te avise qué correos molestos se eliminaron, y otro que te avise qué correos importantes quedaron pendientes.

NOTIFICACIÓN DE CORREOS ELIMINADOS

Haz clic en el "+" que sale del nodo "Eliminar correos molestos"
Busca Gmail: Enviar (SELECCIONALO)
Renombra el nodo como "Notificación molestos"

Campo                   Valor
To                      Pepitoposo@gmail.com
Subject                 🗑️ Correo molesto eliminado
Message                 Hola Juan! 👋

                        Se eliminó automáticamente el siguiente correo molesto:

                        📧 De: {{ $json.From }}
                        📌 Asunto: {{ $json.Subject }}

                        Tu bandeja de entrada te lo agradece! 🤖



