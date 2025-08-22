import { useState, useEffect } from 'react';

function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const handler = () => setMatches(media.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export default useMediaQuery;  // <-- ici export par défaut
