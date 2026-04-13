export const resetPasswordTemplate = (name: string, code: string) => {
    return `
    <!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restablecer Contraseña - Finnace Manager</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: #f8fafc;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);">
        
        <!-- Header (Idéntico al anterior) -->
        <tr>
            <td align="center" style="padding: 40px 0; background-color: #1e293b;">
                <h1 style="margin: 0; color: #38bdf8; font-size: 28px; letter-spacing: 1px; font-weight: 800;">FINNACE <span style="color: #ffffff;">MANAGER</span></h1>
            </td>
        </tr>

        <!-- Body -->
        <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
                <span style="margin: 0 0 25px 0; font-size: 24px;" >Hola ${name}!</span>
                <h2 style="margin: 0 0 15px 0; font-size: 22px; color: #ffffff;">Restablecer contraseña</h2>
                <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: #94a3b8;">
                    Has solicitado restablecer tu contraseña en Finnace Manager. Utiliza el siguiente código para completar el proceso. Este código expirará en 15 minutos.
                </p>
                
                <!-- Contenedor del Código (Mismo estilo que verificación) -->
                <div style="background-color: #0f172a; border: 2px dashed #38bdf8; border-radius: 8px; padding: 20px; margin: 0 auto; display: inline-block;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #38bdf8;">
                        ${code}
                    </span>
                </div>

                <p style="margin: 30px 0 0 0; font-size: 14px; color: #64748b;">
                    ¿No solicitaste este cambio? <br>
                    Si no fuiste tú, puedes ignorar este mensaje de forma segura. Tu contraseña actual no cambiará.
                </p>
            </td>
        </tr>

        <!-- Footer (Idéntico al anterior) -->
        <tr>
            <td style="padding: 30px; background-color: #0f172a; border-top: 1px solid #334155; text-align: center;">
                <p style="margin: 0; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 1px;">
                    Seguridad Finnace Manager
                </p>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #475569;">
                   ©GEMA 2026 Finnace Manager Peru 
                </p>
            </td>
        </tr>
    </table>
</body>
</html>

    `
}