import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(__dirname, '../../.env') });

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: { url: process.env.DIRECT_URL },
});
