import { useState, useEffect } from 'react';
import { load, save } from '../lib/storage';

/**
 * Hook utilitaire simplifiant la persistance d'état dans localStorage
 * via les helpers sécurisés load et save de storage.js.
 * 
 * @param {string} key Clé de stockage
 * @param {*} defaultValue Valeur par défaut si absente ou corrompue
 * @param {Function} [normalizer] Fonction de validation / normalisation optionnelle
 * @returns {[any, Function]} [state, setState]
 */
export const useStoredState = (key, defaultValue, normalizer) => {
  const [state, setState] = useState(() => {
    const fallback = typeof defaultValue === 'function' ? defaultValue() : defaultValue;
    return load(key, fallback, normalizer);
  });

  useEffect(() => {
    save(key, state);
  }, [key, state]);

  return [state, setState];
};

export default useStoredState;
