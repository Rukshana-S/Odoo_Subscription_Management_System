import { createApp, seedDefaultAccounts } from './app.js';

const PORT = process.env.PORT || 5000;

await seedDefaultAccounts();

const app = createApp();
app.listen(PORT, () => {
  console.log(`[BRIGHTLOOP SERVER] REST API Backend running on http://localhost:${PORT}`);
});
