import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json').json(body);
}

function authorized(req) {
  const expected = process.env.ADMIN_DASHBOARD_PASSWORD;
  const supplied = req.headers['x-admin-password'];
  return !!expected && supplied === expected;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const body = req.body || {};
      const name = String(body.customer_name || '').trim();
      const mobile = String(body.customer_mobile || '').replace(/\D/g, '');
      const config = body.config;
      const designName = String(body.design_name || 'Stamp').slice(0, 120);

      if (!name || name.length > 80 || !/^\d{10}$/.test(mobile)) {
        return json(res, 400, { error: 'Invalid customer details' });
      }
      if (!config || typeof config !== 'object' || Array.isArray(config)) {
        return json(res, 400, { error: 'Invalid design data' });
      }

      const { data, error } = await supabase
        .from('customer_designs')
        .insert({
          id: crypto.randomUUID(),
          customer_name: name,
          customer_mobile: mobile,
          design_name: designName,
          config,
          status: 'new',
        })
        .select('id,created_at')
        .single();

      if (error) throw error;
      return json(res, 201, { ok: true, id: data.id, created_at: data.created_at });
    }

    if (!authorized(req)) return json(res, 401, { error: 'Unauthorized' });

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('customer_designs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return json(res, 200, data || []);
    }

    if (req.method === 'PATCH') {
      const id = String(req.query.id || '');
      const status = String((req.body || {}).status || '');
      if (!id || !['new', 'contacted', 'completed'].includes(status)) {
        return json(res, 400, { error: 'Invalid request' });
      }
      const { error } = await supabase
        .from('customer_designs')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      return json(res, 200, { ok: true });
    }

    res.setHeader('Allow', 'GET,POST,PATCH');
    return json(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: 'Server error' });
  }
}
