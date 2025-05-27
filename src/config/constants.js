export const APP_CONFIG = {
  API_URL: import.meta.env.VITE_API_URL,
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
  APP_NAME: import.meta.env.VITE_APP_NAME,
  IS_PRODUCTION: import.meta.env.VITE_APP_ENV === 'production'
};

export const PAYMENT_CONFIG = {
  MONTHLY_FEE: 100,
  CURRENCY: 'BRL',
  LOCALE: 'pt-BR'
};

export default {
  APP_CONFIG,
  PAYMENT_CONFIG
};