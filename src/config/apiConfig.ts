// /api/client/index.ts
import axios from 'axios';
import config from './env';

const apiClientASIN = axios.create({
    // baseURL: config.API_BASE_URL,
    baseURL: "https://esalesindia.asus.com/app/api/",
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Expect': '',
    },
});

const apiClientAPAC = axios.create({
    baseURL: "https://esales.asus.com/app/api/",
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Expect': '',
    },
});


export {apiClientASIN, apiClientAPAC};