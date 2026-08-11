// Subscription storage with three interchangeable backends, selected by the
// STORAGE env var (or inferred from the environment):
//
//   - "firestore" : Google Cloud Firestore (native mode). Zero-config on
//                   Cloud Run — auth comes from the runtime service account.
//                   Recommended for GCP deployments (free tier is plenty).
//   - "postgres"  : the original pg backend (DATABASE_URL). For Render/Neon/
//                   Supabase or any managed Postgres.
//   - "memory"    : in-process map, lost on restart. For local dev and tests.
//
// Default: postgres if DATABASE_URL is set, else firestore if running on GCP
// (K_SERVICE is set on Cloud Run), else memory.

const crypto = require('crypto');

function resolveBackend() {
  const explicit = (process.env.STORAGE || '').toLowerCase();
  if (explicit) return explicit;
  if (process.env.DATABASE_URL) return 'postgres';
  if (process.env.K_SERVICE || process.env.GOOGLE_CLOUD_PROJECT) return 'firestore';
  return 'memory';
}

// Each backend implements:
//   init(): Promise<void>
//   upsert({ endpoint, p256dh, auth, reminders, tz }): Promise<void>
//   getAll(): Promise<Array<{ endpoint, p256dh, auth, reminders, tz }>>
//   removeByEndpoint(endpoint): Promise<void>

function postgresBackend() {
  const { Pool } = require('pg');
  const useSSL = process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: useSSL });

  return {
    name: 'postgres',
    async init() {
      await pool.query(`
        create table if not exists subscriptions (
          id serial primary key,
          endpoint text unique not null,
          p256dh text not null,
          auth text not null,
          reminders jsonb not null default '[]'::jsonb,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );
        create index if not exists idx_subscriptions_updated_at on subscriptions(updated_at desc);
        alter table subscriptions add column if not exists tz text not null default 'UTC';
      `);
    },
    async upsert({ endpoint, p256dh, auth, reminders, tz }) {
      await pool.query(
        `
        insert into subscriptions (endpoint, p256dh, auth, reminders, tz)
        values ($1, $2, $3, $4, $5)
        on conflict (endpoint)
        do update set p256dh = excluded.p256dh,
                      auth = excluded.auth,
                      reminders = excluded.reminders,
                      tz = excluded.tz,
                      updated_at = now()
        `,
        [endpoint, p256dh, auth, JSON.stringify(reminders), tz]
      );
    },
    async getAll() {
      const { rows } = await pool.query(`select endpoint, p256dh, auth, reminders, tz from subscriptions`);
      return rows.map(r => ({ ...r, reminders: r.reminders || [], tz: r.tz || 'UTC' }));
    },
    async removeByEndpoint(endpoint) {
      await pool.query(`delete from subscriptions where endpoint = $1`, [endpoint]);
    },
  };
}

function firestoreBackend() {
  const { Firestore } = require('@google-cloud/firestore');
  const db = new Firestore();
  const col = db.collection(process.env.FIRESTORE_COLLECTION || 'push_subscriptions');
  // Endpoints are long URLs — hash them for stable, valid document IDs.
  const docId = endpoint => crypto.createHash('sha256').update(endpoint).digest('hex');

  return {
    name: 'firestore',
    async init() {
      // No schema to create; fail fast if credentials/API are missing.
      await col.limit(1).get();
    },
    async upsert({ endpoint, p256dh, auth, reminders, tz }) {
      await col.doc(docId(endpoint)).set({
        endpoint, p256dh, auth, reminders, tz,
        updatedAt: new Date().toISOString(),
      });
    },
    async getAll() {
      const snap = await col.get();
      return snap.docs.map(d => {
        const v = d.data();
        return { endpoint: v.endpoint, p256dh: v.p256dh, auth: v.auth, reminders: v.reminders || [], tz: v.tz || 'UTC' };
      });
    },
    async removeByEndpoint(endpoint) {
      await col.doc(docId(endpoint)).delete();
    },
  };
}

function memoryBackend() {
  const map = new Map();
  return {
    name: 'memory',
    async init() {},
    async upsert(sub) { map.set(sub.endpoint, { ...sub }); },
    async getAll() { return [...map.values()]; },
    async removeByEndpoint(endpoint) { map.delete(endpoint); },
  };
}

function createStorage() {
  const backend = resolveBackend();
  switch (backend) {
    case 'postgres': return postgresBackend();
    case 'firestore': return firestoreBackend();
    case 'memory': return memoryBackend();
    default: throw new Error(`Unknown STORAGE backend: ${backend}`);
  }
}

module.exports = { createStorage };
