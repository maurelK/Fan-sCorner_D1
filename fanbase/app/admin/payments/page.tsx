"use client";

import React, { useEffect, useState } from 'react';

interface PaymentRequest {
  id: string;
  creator_id: string;
  fan_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  amount: number;
  status: string;
  created_at: string;
  notes?: string;
}

export default function AdminPaymentsPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txById, setTxById] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/payment-requests', { credentials: 'include' });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt}`);
      }
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (e: any) {
      setError(e.message || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

const confirmRequest = async (id: string) => {
  const tx = txById[id];
  if (!tx) return alert('Veuillez entrer un ID de transaction');

  setProcessingId(id);

  try {
    const res = await fetch('/api/admin/confirm-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: id, transaction_id: tx }),
      credentials: 'include'
    });

    const text = await res.text();

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`Réponse non JSON : ${text}`);
    }

    if (res.ok && json.success) {
      alert('Confirmé: ' + (json.message || 'OK'));
      loadRequests();
    } else {
      alert('Erreur: ' + (json.error || JSON.stringify(json)));
    }

  } catch (e: any) {
    alert(e.message || 'Erreur');
  } finally {
    setProcessingId(null);
  }
};


  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Administration — Demandes de paiement</h1>

      <div className="mb-4">
        <button onClick={loadRequests} className="px-4 py-2 bg-blue-600 text-white rounded">Rafraîchir</button>
      </div>

      {loading && <p>Chargement...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && requests.length === 0 && <p>Aucune demande en attente.</p>}

      <div className="space-y-4">
        {requests.map((r) => (
          <div key={r.id} className="border rounded p-4 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{r.user_name} — {r.user_email}</div>
                <div className="text-sm text-gray-600">Montant: {r.amount} FCFA • Statut: {r.status}</div>
                <div className="text-sm text-gray-500">Num: {r.user_phone} — ID: {r.id}</div>
              </div>
              <div className="w-56">
                <input
                  placeholder="ID transaction"
                  value={txById[r.id] || ''}
                  onChange={(e) => setTxById((s) => ({ ...s, [r.id]: e.target.value }))}
                  className="w-full px-2 py-1 border rounded mb-2"
                />
                <button
                  onClick={() => confirmRequest(r.id)}
                  disabled={processingId === r.id}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded"
                >
                  {processingId === r.id ? 'Traitement...' : 'Confirmer paiement'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
