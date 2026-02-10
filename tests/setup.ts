beforeAll(async () => {
  const { initDb } = await import('../src/database/connection.ts');
  await initDb();
});

afterAll(async () => {
  const { closeDb } = await import('../src/database/connection.ts');
  await closeDb();
});