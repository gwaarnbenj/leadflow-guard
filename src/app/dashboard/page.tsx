import { supabaseAdmin } from '@/lib/supabase';

export default async function Dashboard() {
  const { data: runs } = await supabaseAdmin
    .from('check_runs')
    .select('status, summary, started_at, goal_id')
    .order('started_at', { ascending: false })
    .limit(10);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Recent Checks</h1>
      <div className="space-y-2">
        {(runs || []).map((r, i) => (
          <div key={i} className="border rounded p-3 text-sm flex items-center justify-between">
            <div>
              <div className="font-medium">{r.status.toUpperCase()}</div>
              <div className="text-gray-600">{r.summary}</div>
            </div>
            <div className="text-gray-500">{new Date(r.started_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
