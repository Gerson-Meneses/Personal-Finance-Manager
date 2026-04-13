export const passwordReseted = (name: string, fecha_cambio: string) => {
    return `
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contraseña Actualizada - Finnace Manager</title>
</head>

<body
    style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: #f8fafc;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
        style="max-width: 600px; margin: 20px auto; background-color: #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);">
        <tr>
            <td align="center" style="padding: 40px 0; background-color: #1e293b;">
                <h1 style="margin: 0; color: #38bdf8; font-size: 28px; letter-spacing: 1px; font-weight: 800;">FINNACE
                    <span style="color: #ffffff;">MANAGER</span></h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
                <div style="margin-bottom: 20px; font-size: 50px;">🛡️</div>
                <span style="margin: 0 0 25px 0; font-size: 24px;" >Hola ${name}</span>
                <h2 style="margin: 0 0 15px 0; font-size: 24px; color: #ffffff;">Tu contraseña ha sido cambiada</h2>
                <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: #94a3b8;">
                    Te informamos que la contraseña de tu cuenta en <strong>Finnace Manager</strong> se ha actualizado
                    correctamente.
                </p>
                <div style="background-color: #0f172a; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                    <p style="margin: 0; font-size: 14px; color: #38bdf8;">
                        Fecha del cambio: <strong>${fecha_cambio}</strong>
                    </p>
                </div>
                <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b;">
                    Si tú no realizaste este cambio, por favor contacta con nuestro equipo de soporte técnico de
                    inmediato.
                </p>
            </td>
        </tr>
        <tr>
            <td style="padding: 30px; background-color: #0f172a; border-top: 1px solid #334155; text-align: center;">
                <p style="margin: 0; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 1px;">
                    Centro de Seguridad Finnace Manager
                </p>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #475569;">
                    ©GEMA 2026 Finnace Manager Piura Peru
                </p>
            </td>
        </tr>
    </table>
</body>

</html>
`
}