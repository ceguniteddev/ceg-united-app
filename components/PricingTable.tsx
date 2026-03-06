'use client';

import { useEffect, useState } from 'react';

type SortDir = 'asc' | 'desc' | null;
type SortType = 'int' | 'float' | 'string';

interface PricingItem {
  image: string;
  bank_name: string;
  card_id: number | string;
  credit_limit: string;
  credit_limit_original: number | string;
  date_opened: string;
  date_opened_original: number | string;
  purchase_deadline: string;
  purchase_deadline_original: number | string;
  reporting_period: string;
  reporting_period_original: number | string;
  stock: number | string;
  price: number | string;
}

interface Column {
  key: keyof PricingItem;
  sortKey?: keyof PricingItem; // raw value key for sorting
  label: string;
  type: SortType | null;
  defaultSort?: 'asc' | 'desc';
}

const COLUMNS: Column[] = [
  { key: 'image', label: '', type: null },
  { key: 'bank_name', label: 'Bank Name', type: 'string' },
  { key: 'card_id', label: 'Card ID', type: 'float' },
  { key: 'credit_limit', label: 'Credit Limit', sortKey: 'credit_limit_original', type: 'float' },
  { key: 'date_opened', label: 'Date Opened', sortKey: 'date_opened_original', type: 'float' },
  { key: 'purchase_deadline', label: 'Purchase By Date', sortKey: 'purchase_deadline_original', type: 'float' },
  { key: 'reporting_period', label: 'Reporting Date', sortKey: 'reporting_period_original', type: 'float' },
  { key: 'stock', label: 'Stock', type: 'float' },
  { key: 'price', label: 'Price', type: 'float', defaultSort: 'asc' },
];

function compareValues(a: string | number, b: string | number, type: SortType): number {
  if (type === 'int') {
    return parseInt(String(a), 10) - parseInt(String(b), 10);
  }
  if (type === 'float') {
    return parseFloat(String(a)) - parseFloat(String(b));
  }
  return String(a).localeCompare(String(b));
}

export default function PricingTable() {
  const [items, setItems] = useState<PricingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortColIndex, setSortColIndex] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  useEffect(() => {
    fetch('/api/pricing')
      .then((r) => {
        if (!r.ok) throw new Error(`Request failed: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setItems(data);
        // Default sort: price ascending (column index 8)
        setSortColIndex(8);
        setSortDir('asc');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function handleHeaderClick(colIndex: number) {
    const col = COLUMNS[colIndex];
    if (!col.type) return;

    if (sortColIndex === colIndex) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColIndex(colIndex);
      setSortDir(col.defaultSort ?? 'asc');
    }
  }

  const sorted = [...items].sort((a, b) => {
    if (sortColIndex === null || sortDir === null) return 0;
    const col = COLUMNS[sortColIndex];
    if (!col.type) return 0;
    const key = col.sortKey ?? col.key;
    const diff = compareValues(a[key] as string | number, b[key] as string | number, col.type);
    return sortDir === 'asc' ? diff : -diff;
  });

  return (
    <div className="container mx-auto px-4 py-6">
      {loading && <p className="text-center text-gray-500">Loading…</p>}
      {error && <p className="text-center text-red-600">Error: {error}</p>}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                {COLUMNS.map((col, i) => (
                  <th
                    key={col.key}
                    onClick={() => handleHeaderClick(i)}
                    className={[
                      'px-3 py-2 text-left font-semibold border-b border-gray-300 whitespace-nowrap',
                      col.type ? 'cursor-pointer select-none hover:bg-gray-200' : '',
                      sortColIndex === i && sortDir === 'asc' ? 'after:content-["_▲"]' : '',
                      sortColIndex === i && sortDir === 'desc' ? 'after:content-["_▼"]' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {col.label}
                    {sortColIndex === i && sortDir === 'asc' && ' ▲'}
                    {sortColIndex === i && sortDir === 'desc' && ' ▼'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((item, rowIdx) => (
                <tr key={rowIdx} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-3 py-2">
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.bank_name} style={{ width: 50 }} />
                    )}
                  </td>
                  <td className="px-3 py-2">{item.bank_name}</td>
                  <td className="px-3 py-2">{item.card_id}</td>
                  <td className="px-3 py-2">{item.credit_limit}</td>
                  <td className="px-3 py-2">{item.date_opened}</td>
                  <td className="px-3 py-2">{item.purchase_deadline}</td>
                  <td className="px-3 py-2">{item.reporting_period}</td>
                  <td className="px-3 py-2">{item.stock}</td>
                  <td className="px-3 py-2">${item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
