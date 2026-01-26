import * as Keychain from 'react-native-keychain';

import {MMKV} from 'react-native-mmkv';
import {PersistStorage} from 'zustand/middleware';
import {createAsyncStoragePersister} from '@tanstack/query-async-storage-persister';

let mmkvInstance: MMKV | null = null;

// Generate a secure random hex string
const generateRandomKey = () =>
  Array.from({length: 32}, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('');

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
  if (mmkvInstance) return; // Already initialized 
  // const key = await loadEncryptionKey();
  const key = '$5K#wP9!rT2@nQx' // Static key for testing purposes only
  mmkvInstance = new MMKV({
    id: 'secure-storage',
    encryptionKey: key,
  });
  console.log('✅ MMKV initialized with encryption key.');
}

// Ensure MMKV is initialized before usage
export function getMMKV(): MMKV {
  if (!mmkvInstance) {
    throw new Error('❌ MMKV is not initialized. Call initializeMMKV() first.');
  }
  return mmkvInstance;
}

// Zustand-compatible storage wrapper
export function createMMKVStorage<T>(): PersistStorage<T> {
  return {
    setItem: (name, value) => {
      getMMKV().set(name, JSON.stringify(value));
    },
    getItem: name => {
      const value = getMMKV().getString(name);
      return value ? JSON.parse(value) : null;
    },
    removeItem: name => {
      getMMKV().delete(name);
    },
  };
}
// --- React Query-compatible wrapper ---
export function createRQMMKVPersister(): ReturnType<
  typeof createAsyncStoragePersister
> {
  return createAsyncStoragePersister({
    storage: {
      setItem: (name, value) => {
        getMMKV().set(name, value); // value is already serialized
      },
      getItem: name => {
        return getMMKV().getString(name) ?? null;
      },
      removeItem: name => {
        getMMKV().delete(name);
      },
    },
  });
}
