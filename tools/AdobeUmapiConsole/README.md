# Adobe UMAPI Console

Aplicación de consola (.NET 8) para **consultar usuarios**, **listar grupos** y **asignar / desasignar licencias** con la Adobe User Management API.

En Adobe, asignar software = agregar al **product profile** (`type: PRODUCT_PROFILE`). El `groupName` debe coincidir exactamente.

## Requisitos

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- Credenciales OAuth Server-to-Server del proyecto en [Adobe Developer Console](https://developer.adobe.com/console) (API: User Management)

## Configuración

```bash
cd tools/AdobeUmapiConsole
copy appsettings.example.json appsettings.json
```

Edita `appsettings.json`:

```json
{
  "Adobe": {
    "OrganizationId": "XXXX@AdobeOrg",
    "ClientId": "tu-client-id",
    "ClientSecret": "tu-client-secret",
    "AccessToken": "",
    "Scopes": "openid,AdobeID,user_management_sdk"
  }
}
```

- Si dejas `AccessToken` vacío, la app pide el token a IMS (`client_credentials`).
- Si ya tienes un bearer de Postman, pégalo en `AccessToken` (sigue haciendo falta `ClientId` para el header `x-api-key`).

No subas `appsettings.json` con secretos.

En el **portal**, las mismas operaciones usan credenciales de **Key Vault** vía FA C# (no este `appsettings.json`). Ver [docs/ASIGNACION-LICENCIAS.md](../../docs/ASIGNACION-LICENCIAS.md).

## Ejecutar

```bash
cd tools/AdobeUmapiConsole
dotnet run
```

Menú:

1. Consultar usuario (`GET .../users/{email}`)
2. Listar grupos, con filtro a `PRODUCT_PROFILE` (`GET .../groups/{org}/{page}`)
3. Asignar licencia (`POST .../action` → `add`)
4. Desasignar licencia (`POST .../action` → `remove`)
5. Crear usuario federado (`createFederatedID`)

Tras asignar/quitar, vuelve a consultar el usuario para verificar `groups`. Opción `testOnly` valida el comando sin aplicar cambios.

## Notas

- No envía el campo `domain` cuando `user` es un email (evita `error.command.domain.must_be_used_with_nonemail_username`).
- Reintenta automáticamente ante HTTP 429.
- La verificación real es el GET del usuario, no un correo de Adobe.

Documentación de los mismos flujos: [docs/ADOBE-UMAPI.md](../../docs/ADOBE-UMAPI.md)
