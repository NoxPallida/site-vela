import { defineConfig } from 'astro/config';

export default defineConfig({
  image: {
    // Liste des domaines distants à autoriser
    domains: [
      'assets.pokemon.com',
      'www.pokepedia.fr'
    ],
    // Optionnel : spécifier les formats cibles par défaut
    service: {
      config: {
        limitInputPixels: false,
      }
    }
  }
});
