/* Entry for `npm start` / Google AI Studio / any Node host. No npm packages needed. Uses PORT env (default 3000). */
process.argv[2]=process.argv[2]||process.env.PORT||'3000';
await import('./tools/serve.mjs');
