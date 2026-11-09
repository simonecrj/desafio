
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Globe2, Search, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

type CountryItem = {
  id: number;
  name: string;
  country?: string | null;
  state?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  description?: string | null;
};

type ApiResponse = {
  data?: CountryItem[];
  countries?: CountryItem[];
  regions?: CountryItem[];
};

export default function Countries() {
  const [items, setItems] = useState<CountryItem[]>([]);
  const [q, setQ] = useState('');
  const [region, setRegion] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/regions');
      const data = response.data;
      console.log('RESPOSTA COMPLETA:', data);
      console.log('QUANTIDADE RECEBIDA:',
        Array.isArray(data)
          ? data.length
          : data?.data?.length ??
          data?.regions?.length ??
          data?.countries?.length
      );
      let list: CountryItem[] = [];

      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data?.data)) {
        list = data.data;
      } else if (Array.isArray(data?.regions)) {
        list = data.regions;
      } else if (Array.isArray(data?.countries)) {
        list = data.countries;
      }

      const validItems = list.filter(
        (item) =>
          item &&
          typeof item.id === 'number' &&
          (typeof item.name === 'string' ||
            typeof item.country === 'string')
      );

      setItems(validItems);

      console.log('Total de registros recebidos:', validItems.length);
      console.log('Registros da API:', validItems);
    } catch (err) {
      console.error('Erro ao carregar países:', err);
      setError(
        'Não foi possível carregar os países. Verifique se o backend está funcionando e tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const regions = useMemo(() => {
    const values = items
      .map((item) => item.country || item.name)
      .filter(Boolean);

    return [
      'Todos',
      ...Array.from(new Set(values)).sort((a, b) =>
        a.localeCompare(b, 'pt-BR')
      ),
    ];
  }, [items]);

  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();

    return items.filter((item) => {
      const name = item.name || '';
      const country = item.country || '';
      const state = item.state || '';

      const matchesSearch =
        name.toLowerCase().includes(search) ||
        country.toLowerCase().includes(search) ||
        state.toLowerCase().includes(search);

      const countryName = country || name;

      const matchesRegion =
        region === 'Todos' || countryName === region;

      return matchesSearch && matchesRegion;
    });
  }, [items, q, region]);

  function getCountryName(item: CountryItem) {
    const countryName = item.country || item.name || 'País não informado';

    return countryName.replace(/^NASA POWER\s*-\s*/i, '').trim();
  }

  return (
    <main className="countries-page">
      <header className="countries-header">
        <div>
          <h1>
            <Globe2 size={26} />
            Países do mundo
          </h1>

          <p>
            Explore os países e regiões cadastrados no CtrlClima.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          aria-label="Atualizar lista de países"
        >
          <RefreshCw
            size={17}
            className={loading ? 'animate-spin' : ''}
          />
          Atualizar
        </button>
      </header>

      <section className="countries-summary">
        <strong>{items.length}</strong>
        <span>registros carregados</span>
      </section>

      <section className="countries-filters">
        <div className="countries-search">
          <Search size={18} />

          <input
            type="search"
            placeholder="Buscar país ou estado..."
            value={q}
            onChange={(event) => setQ(event.target.value)}
            aria-label="Buscar país ou estado"
          />
        </div>

        <select
          value={region}
          onChange={(event) => setRegion(event.target.value)}
          aria-label="Filtrar por país"
        >
          {regions.map((item) => (
            <option key={item} value={item}>
              {item === 'Todos' ? 'Todos os países' : item}
            </option>
          ))}
        </select>
      </section>

      {loading && (
        <p role="status">Carregando países...</p>
      )}

      {error && (
        <div role="alert" className="countries-error">
          <p>{error}</p>

          <button type="button" onClick={() => void load()}>
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <p className="countries-results">
            Exibindo <strong>{filtered.length}</strong> de{' '}
            <strong>{items.length}</strong> registros.
          </p>

          {filtered.length > 0 ? (
            <section className="countries-grid">
              {filtered.map((item) => (
                <article className="country-card" key={item.id}>
                  <div className="country-card-icon">
                    <Globe2 size={22} />
                  </div>

                  <div className="country-card-content">
                    <h2>{getCountryName(item)}</h2>

                    {item.state && (
                      <span>{item.state}</span>
                    )}

                    {item.description && (
                      <p>{item.description}</p>
                    )}

                    {item.latitude != null &&
                      item.longitude != null && (
                        <small>
                          Latitude: {item.latitude}
                          {' · '}
                          Longitude: {item.longitude}
                        </small>
                      )}
                  </div>
                </article>
              ))}
            </section>
          ) : (
            <div className="countries-empty">
              <Globe2 size={32} />
              <p>Nenhum país encontrado.</p>
              <span>
                Tente pesquisar por outro nome ou remover os filtros.
              </span>
            </div>
          )}
        </>
      )}
    </main>
  );
}
