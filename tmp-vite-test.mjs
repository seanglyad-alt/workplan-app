import { createServer } from "vite";
(async () => {
  const server = await createServer({ configFile: 'vite.config.ts', server: { middlewareMode: true }, appType: 'spa' });
  try {
    const result = await server.transformRequest('/src/components/PageSettings.tsx');
    console.log('RESULT', !!result);
    if (result) console.log(result.code.slice(0,400));
  } catch (e) {
    console.error('ERROR', e);
  } finally {
    await server.close();
  }
})();
