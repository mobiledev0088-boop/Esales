// /api/client/index.ts
import axios from 'axios';
import config from './env';

const apiClientASIN = axios.create({
  // baseURL: config.API_BASE_URL,
  baseURL: 'https://esalesindia.asus.com/app/api/',
  timeout: 60000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

const apiClientAPAC = axios.create({
  baseURL: 'https://esales.asus.com/app/api/',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export {apiClientASIN, apiClientAPAC};
