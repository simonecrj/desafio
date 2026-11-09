
import { useCallback, useEffect, useState } from 'react';
import { MapPinned, RefreshCw } from 'lucide-react';
import { api, type Region } from '../services/api';

export default function Regions() {
  const [items, setItems] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/regions');
      const data = response.data;

      console.log('RESPOSTA COMPLETA:', data);
      console.log(
        'TOTAL RECEBIDO:',
        Array.isArray(data) ? data.length : 'A resposta não é um array'
      );

      const regions: Region[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.regions)
            ? data.regions
            : Array.isArray(data?.countries)
              ? data.countries
              : [];

      setItems(regions);

      console.log('REGIÕES EXIBÍVEIS:', regions.length);
    } catch (err) {
      console.error('ERRO AO BUSCAR REGIÕES:', err);
      setError(
        'Não foi possível consultar regiões. Verifique a API e a conexão.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);


  
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">ÁREAS MONITORADAS</div>
          <h1>Regiões de estudo</h1>
          <p>Regiões cadastradas na base do CtrlClima.</p>
          <p>
            <strong>{items.length}</strong> regiões carregadas.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="panel">Carregando regiões…</div>
      ) : items.length > 0 ? (
        <div className="country-grid">
          {items.map((region) => (
            <article className="panel region-card" key={region.id}>
              <div className="region-icon">
                <MapPinned />
              </div>

              <h2>
                {region.name.replace(/^NASA POWER\s*-\s*/i, '')}
              </h2>

              <p>
                {[region.state, region.country]
                  .filter(Boolean)
                  .join(' · ')}
              </p>

              <p>
                {region.description || 'Sem descrição cadastrada.'}
              </p>

              <div className="region-meta">
                <span>Lat. {region.latitude ?? '—'}</span>
                <span>Long. {region.longitude ?? '—'}</span>
                <strong>
                  {region._count?.measurements ?? 0} medições
                </strong>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="panel">
          Nenhuma região cadastrada no banco ainda.
        </div>
      )}
    </div>
  );
}
