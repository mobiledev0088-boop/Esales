import * as Keychain from 'react-native-keychain';

import { MMKV } from 'react-native-mmkv';
import { PersistStorage } from 'zustand/middleware';
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
let mmkvInstance: MMKV | null = null;

// Generate a secure random hex string
const generateRandomKey = (length = 32): string =>
    Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');

// Get or create a secure encryption key using Keychain
async function loadEncryptionKey(): Promise<string> {
    const credentials = await Keychain.getGenericPassword();

    if (credentials) {
        return credentials.password;
    }

    const newKey = generateRandomKey();
    await Keychain.setGenericPassword('mmkv', newKey);
    return newKey;
}

// Must be called before using MMKV
export async function initializeMMKV(): Promise<void> {
    const key = await loadEncryptionKey();

    mmkvInstance = new MMKV({
        id: 'secure-storage',
        encryptionKey: key,
    });
}

// Ensure MMKV is initialized before usage
function getMMKV(): MMKV {
    if (!mmkvInstance) {
        throw new Error('❌ MMKV is not initialized. Call initializeMMKV() first.');
    }
    return mmkvInstance;
}

// Zustand-compatible storage wrapper
export function createMMKVStorage<T>(keyPrefix?: string): PersistStorage<T> {
    const formatKey = (name: string) => (keyPrefix ? `${keyPrefix}-${name}` : name);

    return {
        setItem: (name, value) => {
            getMMKV().set(formatKey(name), JSON.stringify(value));
        },
        getItem: (name) => {
            const value = getMMKV().getString(formatKey(name));
            return value ? JSON.parse(value) : null;
        },
        removeItem: (name) => {
            getMMKV().delete(formatKey(name));
        },
    };
}
// --- React Query-compatible wrapper ---
export function createRQMMKVPersister(): ReturnType<typeof createAsyncStoragePersister> {
  return createAsyncStoragePersister({
    storage: {
      setItem: (name, value) => {
        getMMKV().set(name, value); // value is already serialized
      },
      getItem: (name) => {
        return getMMKV().getString(name) ?? null;
      },
      removeItem: (name) => {
        getMMKV().delete(name);
      },
    },
  });
}

