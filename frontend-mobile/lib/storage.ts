import AsyncStorageModule from '@react-native-async-storage/async-storage';

type StorageApi = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const storageModule = AsyncStorageModule as unknown as StorageApi & { default?: StorageApi };

const AsyncStorage: StorageApi = storageModule.default ?? storageModule;

export default AsyncStorage;
