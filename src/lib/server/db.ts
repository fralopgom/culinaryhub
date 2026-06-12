import postgres from 'postgres';
import { env } from '$env/dynamic/private';

const db = postgres(env.DATABASE_URL!, { max: 10 });

export default db;
