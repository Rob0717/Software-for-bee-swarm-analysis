import { execSync } from 'child_process';

const apiUrl = 'http://127.0.0.1:3000/api';
const command = `openapi-typescript ${apiUrl}/doc-json --output src/api-types.ts`;
execSync(command, { stdio: 'inherit' });
