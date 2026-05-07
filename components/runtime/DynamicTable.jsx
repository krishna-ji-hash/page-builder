'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getColumnsForPath } from '@/lib/runtime/dataSourceRegistry';
import { useRuntimeData } from './RuntimeProvider';

const empty = '—';

function normalizePath(path) {
  if (typeof path !== 'string' || !path.length) return null;
  if (!path.startsWith('/api/')) return null;
  return path;
}

function filterRows(rows, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => {
    if (!row || typeof row !== 'object') return false;
    return Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(q));
  });
}

export default function DynamicTable({ columns = [], dataSource, className, style }) {
  const { fetchInternal, dataRefreshKey } = useRuntimeData();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const path = dataSource?.kind === 'internal_api' ? normalizePath(dataSource.path) : null;
  const method = (dataSource?.method || 'GET').toUpperCase();

  const effectiveColumns = useMemo(() => {
    if (Array.isArray(columns) && columns.length) {
      return columns;
    }
    if (path) {
      const fromReg = getColumnsForPath(path);
      if (fromReg?.length) return fromReg;
    }
    return [{ key: 'value', label: 'Value' }];
  }, [columns, path]);

  const load = useCallback(async () => {
    if (!path) {
      setLoading(false);
      setData(null);
      setError(dataSource ? 'Invalid data source: only internal /api/ paths are allowed' : 'No data source');
      return;
    }
    if (method !== 'GET') {
      setLoading(false);
      setData(null);
      setError('Only GET is supported for table data');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const json = await fetchInternal(path, { method: 'GET' });
      setData(Array.isArray(json) ? json : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dataSource, fetchInternal, method, path]);

  useEffect(() => {
    load();
  }, [load, dataRefreshKey]);

  const displayRows = useMemo(
    () => filterRows(data || [], search),
    [data, search]
  );

  if (error && (data == null || data === undefined) && !loading) {
    return (
      <div className={`live-table live-table--error ${className || ''}`.trim()} style={style}>
        <p className="live-table__message">{error}</p>
        <div className="live-table__actions">
          <button type="button" className="live-table__retry" onClick={load}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading && data == null) {
    return (
      <div className={`live-table live-table--loading ${className || ''}`.trim()} style={style}>
        <p className="live-table__message">Loading…</p>
      </div>
    );
  }

  if (data != null && !data.length && !search.trim()) {
    return (
      <div className={`live-table live-table--empty ${className || ''}`.trim()} style={style}>
        <p className="live-table__message">No data</p>
        <div className="live-table__actions">
          <button type="button" className="live-table__retry" onClick={load}>
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`live-table ${className || ''}`.trim()} style={style}>
      <div className="live-table__toolbar">
        <label className="live-table__search">
          <span className="live-table__search-label">Filter</span>
          <input
            type="search"
            className="live-table__search-input"
            placeholder="Search rows…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Filter table"
          />
        </label>
        <button type="button" className="live-table__refresh" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>
      {error ? (
        <p className="live-table__banner live-table__banner--warn" role="status">
          {error} (showing previous or empty)
        </p>
      ) : null}
      {!displayRows.length ? (
        <p className="live-table__message">No rows match the filter</p>
      ) : (
        <table className="live-table__table">
          <thead>
            <tr>
              {effectiveColumns.map((c) => (
                <th key={c.key}>{c.label || c.key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, idx) => (
              <tr key={row.id ?? idx}>
                {effectiveColumns.map((c) => (
                  <td key={c.key}>
                    {row && row[c.key] != null && row[c.key] !== '' ? String(row[c.key]) : empty}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
