import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../config/emailjs';

export const enviarEmailConfirmacion = async (reservaData) => {
  try {
    const templateParams = {
      to_email: reservaData.email,
      cliente_nombre: reservaData.nombre,
      fecha: reservaData.fecha,
      hora: reservaData.hora,
      num_personas: reservaData.num_personas,
      area_nombre: reservaData.area_nombre || 'Por asignar',
      telefono: reservaData.telefono || 'No especificado',
      codigo_verificacion: reservaData.codigo_verificacion,
      verificacion_url: `${window.location.origin}/reservas/verificar`,
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );

    return { success: true, data: response };
  } catch (error) {
    console.error('Error al enviar email:', error);
    return { success: false, error: error.text || 'Error al enviar email' };
  }
};

export const inicializarEmailJS = () => {
  emailjs.init(EMAILJS_CONFIG.publicKey);
};
