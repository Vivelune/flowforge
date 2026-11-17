import { ensureTopics } from '@flowforge/kafka';

ensureTopics()
  .then(() => {
    console.log('[topics] done');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[topics] failed', err);
    process.exit(1);
  });
