import { useEffect, useState } from 'react';
import api from '../api';

export default function ApiDocs() {
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api-docs')
      .then((response) => setDocs(response.data))
      .catch((requestError) => {
        console.error('API documentation request failed:', requestError);
        setError('API documentation is unavailable. Start the backend server and try again.');
      });
  }, []);

  if (error) return <p className="rounded border border-red-700/50 bg-red-900/20 p-4 text-sm text-red-300">{error}</p>;
  if (!docs) return <p className="py-6 text-center text-sm text-gray-500">Loading API documentation…</p>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-100">{docs.title} <span className="text-xs text-sky-300">v{docs.version}</span></h2>
        <p className="mt-1 text-xs text-gray-400">{docs.description}</p>
        <code className="mt-2 inline-block rounded bg-slate-800 px-2 py-1 text-xs text-sky-400">{docs.baseUrl}</code>
      </div>
      <div className="space-y-2">
        {docs.endpoints.map((endpoint) => (
          <div key={`${endpoint.method}-${endpoint.path}`} className="rounded-lg border border-slate-700/70 bg-slate-800/50 px-4 py-3">
            <span className="mr-3 rounded border border-sky-700/60 px-1.5 py-0.5 text-[10px] font-mono font-bold text-sky-300">{endpoint.method}</span>
            <code className="text-xs text-sky-300">{endpoint.path}</code>
            <p className="mt-2 text-xs text-gray-400">{endpoint.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
