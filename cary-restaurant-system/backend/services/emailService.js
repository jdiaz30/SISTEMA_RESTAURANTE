const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'restaurantecary@gmail.com',
    pass: process.env.EMAIL_PASSWORD || '',
  },
});

const formatearFecha = (fecha) => {
  const date = new Date(fecha);
  const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('es-DO', opciones);
};

const enviarEmailConfirmacion = async (reserva) => {
  if (!reserva.cliente_email) {
    return { success: false, message: 'No hay email del cliente' };
  }

  const htmlContent = `
    <div style="font-family: system-ui, -apple-system, sans-serif, Arial; font-size: 14px; color: #333; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">

      <!-- Header -->
      <div style="background: linear-gradient(135deg, #d97706 0%, #ea580c 100%); color: white; padding: 30px 20px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🍽️ Restaurante Cary</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Confirmación de Reserva</p>
      </div>

      <!-- Body -->
      <div style="background-color: white; padding: 30px 20px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

        <!-- Greeting -->
        <p style="font-size: 16px; margin: 0 0 20px 0;">Hola <strong>${reserva.cliente_nombre}</strong>,</p>

        <p style="font-size: 15px; color: #059669; margin: 0 0 25px 0;">
          ✓ Tu reserva ha sido <strong>CONFIRMADA</strong> exitosamente.
        </p>

        <!-- Reservation Details -->
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #92400e;">📋 Detalles de tu Reserva</h2>

          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; vertical-align: top;">
                <div style="display: inline-block; width: 30px; text-align: center; font-size: 20px;">📅</div>
                <strong style="color: #78350f;">Fecha:</strong>
              </td>
              <td style="padding: 8px 0; text-align: right; color: #92400e;">
                ${formatearFecha(reserva.fecha)}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; vertical-align: top;">
                <div style="display: inline-block; width: 30px; text-align: center; font-size: 20px;">🕐</div>
                <strong style="color: #78350f;">Hora:</strong>
              </td>
              <td style="padding: 8px 0; text-align: right; color: #92400e;">
                ${reserva.hora}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; vertical-align: top;">
                <div style="display: inline-block; width: 30px; text-align: center; font-size: 20px;">👥</div>
                <strong style="color: #78350f;">Personas:</strong>
              </td>
              <td style="padding: 8px 0; text-align: right; color: #92400e;">
                ${reserva.num_personas}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; vertical-align: top;">
                <div style="display: inline-block; width: 30px; text-align: center; font-size: 20px;">🪑</div>
                <strong style="color: #78350f;">Mesa asignada:</strong>
              </td>
              <td style="padding: 8px 0; text-align: right; color: #92400e;">
                <strong>Mesa ${reserva.mesa_numero}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; vertical-align: top;">
                <div style="display: inline-block; width: 30px; text-align: center; font-size: 20px;">📍</div>
                <strong style="color: #78350f;">Área:</strong>
              </td>
              <td style="padding: 8px 0; text-align: right; color: #92400e;">
                ${reserva.area_nombre || 'Principal'}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; vertical-align: top;">
                <div style="display: inline-block; width: 30px; text-align: center; font-size: 20px;">📞</div>
                <strong style="color: #78350f;">Teléfono:</strong>
              </td>
              <td style="padding: 8px 0; text-align: right; color: #92400e;">
                ${reserva.cliente_telefono}
              </td>
            </tr>
          </table>
        </div>

        <!-- Reservation Code -->
        <div style="background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); color: white; padding: 20px; margin: 25px 0; border-radius: 8px; text-align: center;">
          <div style="font-size: 14px; margin-bottom: 10px; opacity: 0.95;">🎫 CÓDIGO DE RESERVA</div>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 2px; font-family: 'Courier New', monospace; margin: 10px 0;">
            ${reserva.codigo_reserva}
          </div>
          <div style="font-size: 12px; margin-top: 10px; opacity: 0.9;">
            Guarda este código para consultar o cancelar tu reserva
          </div>
        </div>

        <!-- Important Notice -->
        <div style="background-color: #dcfce7; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p style="margin: 0; font-size: 14px; color: #065f46;">
            <strong>✓ CONFIRMADO:</strong> Tu mesa está reservada y confirmada. ¡Te esperamos!
          </p>
        </div>

        <!-- Verification Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/reservas/verificar" style="display: inline-block; background-color: #ea580c; color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 15px;">
            Consultar o Cancelar Reserva
          </a>
        </div>

        <!-- Divider -->
        <div style="border-top: 2px dashed #e5e7eb; margin: 30px 0;"></div>

        <!-- Footer Info -->
        <div style="text-align: center; color: #6b7280; font-size: 13px;">
          <p style="margin: 8px 0;">
            <strong style="color: #374151;">Horario de atención:</strong><br>
            Lunes a Domingo, 11:00 AM - 11:00 PM
          </p>
          <p style="margin: 8px 0;">
            <strong style="color: #374151;">Teléfono:</strong> (809) 555-2279
          </p>
          <p style="margin: 20px 0 0 0; font-size: 16px; color: #d97706;">
            <strong>¡Te esperamos! 🍽️</strong>
          </p>
          <p style="margin: 10px 0 0 0; font-size: 18px; color: #ea580c; font-weight: bold;">
            Restaurante Cary
          </p>
        </div>

      </div>

      <!-- Final Footer -->
      <div style="text-align: center; margin-top: 20px; padding: 15px; color: #9ca3af; font-size: 12px;">
        <p style="margin: 5px 0;">Este es un correo automático de confirmación</p>
        <p style="margin: 5px 0;">Por favor no respondas a este mensaje</p>
      </div>

    </div>
  `;

  const mailOptions = {
    from: `"Restaurante Cary" <${process.env.EMAIL_USER || 'restaurantecary@gmail.com'}>`,
    to: reserva.cliente_email,
    subject: '✓ Reserva Confirmada - Restaurante Cary',
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error al enviar email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  enviarEmailConfirmacion,
};
