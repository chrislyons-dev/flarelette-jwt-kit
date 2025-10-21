
#!/usr/bin/env node
import { generateSecret } from './secret.js';
const len = Number(process.argv.find(a => a.startsWith('--len='))?.split('=')[1] ?? 64);
const json = process.argv.includes('--json');
const dotenv = process.argv.includes('--dotenv');
const key = generateSecret(len);
if (json) console.log(JSON.stringify({ secret: key, lengthBytes: len, format: 'base64url', createdAt: new Date().toISOString() }, null, 2));
else if (dotenv) console.log(`JWT_SECRET=${key}`);
else console.log(key);
