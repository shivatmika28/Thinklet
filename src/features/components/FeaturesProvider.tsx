"use client";

import React, { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import { FeatureSettings, FeatureStoreData } from '../types.ext';
import {
  getFeatureStoreSnapshot,
  getServerFeatureStoreSnapshot,
  subscribeToFeatureStore,
  saveFeatureStore,
  updateFeatureSettings,
  loadFeatureStore,
  DEFAULT_SETTINGS,
  DEFAULT_STORE
} from '../services/featureStore';

interface FeaturesContextType {
  store: FeatureStoreData;
  settings: FeatureSettings;
  updateSettings: (update: Partial<FeatureSettings>) => void;
  saveStore: (update: Partial<FeatureStoreData>) => void;
  refresh: () => void;
}

const FeaturesContext = createContext<FeaturesContextType>({
  store: DEFAULT_STORE,
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  saveStore: () => {},
  refresh: () => {}
});

export const useFeatures = () => useContext(FeaturesContext);

export interface FeaturesProviderProps {
  children: React.ReactNode;
}

export const FeaturesProvider: React.FC<FeaturesProviderProps> = ({ children }) => {
  const store = useSyncExternalStore(
    subscribeToFeatureStore,
    getFeatureStoreSnapshot,
    getServerFeatureStoreSnapshot
  );

  // Synchronize Dyslexia mode onto document body / container class
  useEffect(() => {
    if (store.settings.dyslexiaMode) {
      document.documentElement.classList.add('dyslexia-mode');
    } else {
      document.documentElement.classList.remove('dyslexia-mode');
    }
  }, [store.settings.dyslexiaMode]);

  // Synchronize Interface animations / reduced motion preference
  useEffect(() => {
    if (store.settings.enableAnimations === false) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [store.settings.enableAnimations]);

  const value = useMemo<FeaturesContextType>(() => ({
    store,
    settings: store.settings,
    updateSettings: (upd: Partial<FeatureSettings>) => {
      updateFeatureSettings(upd);
    },
    saveStore: (upd: Partial<FeatureStoreData>) => {
      saveFeatureStore(upd);
    },
    refresh: () => {
      loadFeatureStore(true);
    }
  }), [store]);

  return (
    <FeaturesContext.Provider value={value}>
      {children}
    </FeaturesContext.Provider>
  );
};
