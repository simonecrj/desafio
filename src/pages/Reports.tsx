
import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  FileJson,
  FileText,
  Globe2,
  Printer,
  Search,
  Table2
} from 'lucide-react';
import { api } from '../services/api';

type Parameter = {
  code: string;
  label: string;
  unit: string;
  group: string;
};

type Country = {
  code: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  capital: string | null;
};

type Place = {
  id: number;
  name: string;
  country: string;
  countryCode: string;
  admin1: string;
  latitude: number;
  longitude: number;
  timezone: string | null;
};

type DataRow = {
  date: string;
  [key: string]: string | number | null;
};

type ReportsProps = {
  user: {
    role?: string;
  } | null;
};

const fallbackParameters: Parameter[] = [
  { code: 'T2M', label: 'Temperatura média do ar a 2 m', unit: '°C', group: 'Temperatura' },
  { code: 'T2M_MAX', label: 'Temperatura máxima do ar a 2 m', unit: '°C', group: 'Temperatura' },
  { code: 'T2M_MIN', label: 'Temperatura mínima do ar a 2 m', unit: '°C', group: 'Temperatura' },
  { code: 'T2M_RANGE', label: 'Amplitude diária da temperatura do ar', unit: '°C', group: 'Temperatura' },
  { code: 'TS', label: 'Temperatura da superfície do modelo (não é LST de satélite)', unit: '°C', group: 'Temperatura' },
  { code: 'T2MDEW', label: 'Temperatura do ponto de orvalho a 2 m', unit: '°C', group: 'Temperatura' },
  { code: 'T2MWET', label: 'Temperatura de bulbo úmido a 2 m', unit: '°C', group: 'Temperatura' },
  { code: 'RH2M', label: 'Umidade relativa a 2 m', unit: '%', group: 'Umidade e pressão' },
  { code: 'QV2M', label: 'Umidade específica a 2 m', unit: 'g/kg', group: 'Umidade e pressão' },
  { code: 'PS', label: 'Pressão na superfície', unit: 'kPa', group: 'Umidade e pressão' },
  { code: 'PRECTOTCORR', label: 'Precipitação corrigida', unit: 'mm/dia', group: 'Precipitação' },
  { code: 'WS2M', label: 'Velocidade do vento a 2 m', unit: 'm/s', group: 'Vento' },
  { code: 'WS10M', label: 'Velocidade do vento a 10 m', unit: 'm/s', group: 'Vento' },
  { code: 'WD2M', label: 'Direção do vento a 2 m', unit: 'graus', group: 'Vento' },
  { code: 'WD10M', label: 'Direção do vento a 10 m', unit: 'graus', group: 'Vento' },
  { code: 'ALLSKY_SFC_SW_DWN', label: 'Radiação solar na superfície (céu real)', unit: 'kWh/m²/dia', group: 'Radiação solar' },
  { code: 'CLRSKY_SFC_SW_DWN', label: 'Radiação solar na superfície (céu claro)', unit: 'kWh/m²/dia', group: 'Radiação solar' },
  { code: 'ALLSKY_KT', label: 'Índice de claridade', unit: 'adimensional', group: 'Radiação solar' },
  { code: 'ALLSKY_SFC_PAR_TOT', label: 'Radiação fotossinteticamente ativa', unit: 'W/m²', group: 'Radiação solar' },
  { code: 'GWETTOP', label: 'Umidade do solo superficial', unit: 'fração', group: 'Solo' },
  { code: 'GWETROOT', label: 'Umidade do solo na zona radicular', unit: 'fração', group: 'Solo' }
];

const toApiDate = (value: string) => value.replace(/-/g, '');

const csvCell = (value: unknown) =>
  `"${String(value ?? '').replace(/"/g, '""')}"`;

export default function Reports({ user }: ReportsProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [parameters, setParameters] = useState<Parameter[]>(fallbackParameters);

  const [countryCode, setCountryCode] = useState('');
  const [placeQuery, setPlaceQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [placeLoading, setPlaceLoading] = useState(false);

  const [lat, setLat] = useState('-22.9068');
  const [lon, setLon] = useState('-43.1729');

  const [start, setStart] = useState('2025-01-01');
  const [end, setEnd] = useState('2025-01-07');
  const [community, setCommunity] = useState('AG');

  const [selected, setSelected] = useState<string[]>([
    'T2M',
    'T2M_MAX',
    'T2M_MIN',
    'PRECTOTCORR',
    'RH2M',
    'WS2M'
  ]);

  const [rows, setRows] = useState<DataRow[]>([]);
  const [sourceUrl, setSourceUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  // Carregamento inicial de países e parâmetros
  useEffect(() => {
    async function loadInitialData() {
      try {
        const countriesResponse = await api.get('/countries');

        setCountries(
          Array.isArray(countriesResponse.data)
            ? countriesResponse.data
            : []
        );
      } catch {
        setNotice('Não foi possível carregar a lista de países. Você ainda pode utilizar coordenadas personalizadas.');
      }

      try {
        const parametersResponse = await api.get('/nasa/parameters');

        if (
          Array.isArray(parametersResponse.data) &&
          parametersResponse.data.length > 0
        ) {
          setParameters(parametersResponse.data);
        }
      } catch {
        setNotice('Os parâmetros conhecidos continuam disponíveis, mas não foi possível carregar a lista atualizada da NASA.');
      }
    }

    void loadInitialData();
  }, []);

  // Organização dos parâmetros por categoria
  const grouped = useMemo(() => {
    return parameters.reduce<Record<string, Parameter[]>>((acc, parameter) => {
      (acc[parameter.group] ||= []).push(parameter);
      return acc;
    }, {});
  }, [parameters]);

  // Pesquisa de cidades
  async function searchPlaces() {
    if (placeQuery.trim().length < 2) {
      setError('Digite pelo menos duas letras para pesquisar uma cidade.');
      return;
    }

    setPlaceLoading(true);
    setError('');
    setNotice('');
    setPlaces([]);

    try {
      const response = await api.get('/geocode', {
        params: {
          q: placeQuery.trim()
        }
      });

      const results = Array.isArray(response.data)
        ? response.data
        : [];

      setPlaces(results);

      if (!results.length) {
        setNotice(
          'Nenhuma cidade encontrada. Tente adicionar o país ao nome ou use as coordenadas.'
        );
      }
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
        'Não foi possível pesquisar a cidade.'
      );
    } finally {
      setPlaceLoading(false);
    }
  }

  // Seleciona uma cidade encontrada
  function choosePlace(place: Place) {
    setLat(String(place.latitude));
    setLon(String(place.longitude));

    setPlaceQuery(
      `${place.name}${place.admin1 ? ', ' + place.admin1 : ''}, ${place.country}`
    );

    setPlaces([]);

    setCountryCode(
      countries.find(country => country.code === place.countryCode)?.code || ''
    );
  }

  // Seleciona um país
  function chooseCountry(code: string) {
    setCountryCode(code);
    setPlaceQuery('');

    const country = countries.find(item => item.code === code);

    if (
      country?.latitude != null &&
      country?.longitude != null
    ) {
      setLat(String(country.latitude));
      setLon(String(country.longitude));
    }
  }

  // Seleciona ou remove parâmetros
  function toggleParameter(code: string) {
    setSelected(current => {
      if (current.includes(code)) {
        return current.filter(parameter => parameter !== code);
      }

      if (current.length >= 20) {
        return current;
      }

      return [...current, code];
    });
  }

  // Consulta NASA POWER
  async function runQuery() {
    setError('');
    setNotice('');
    setImportMessage('');

    const latitude = Number(lat);
    const longitude = Number(lon);

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      setError('Informe uma latitude válida entre -90 e 90.');
      return;
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setError('Informe uma longitude válida entre -180 e 180.');
      return;
    }

    if (!selected.length) {
      setError('Selecione ao menos uma variável.');
      return;
    }

    if (selected.length > 20) {
      setError('A NASA POWER aceita até 20 variáveis por consulta.');
      return;
    }

    if (!start || !end || start > end) {
      setError('Confira o período: a data inicial deve ser anterior à data final.');
      return;
    }

    setLoading(true);
    setRows([]);
    setSourceUrl('');

    try {
      const response = await api.get('/nasa/power', {
        params: {
          latitude,
          longitude,
          start: toApiDate(start),
          end: toApiDate(end),
          parameters: selected.join(','),
          community
        }
      });

      const resultRows = Array.isArray(response.data.data)
        ? response.data.data
        : [];

      setRows(resultRows);

      setSourceUrl(
        response.data.sourceUrl || 'https://power.larc.nasa.gov/'
      );

      if (!resultRows.length) {
        setNotice(
          'A API não retornou observações para essa combinação. Tente outro período, local ou comunidade.'
        );
      } else {
        setNotice(
          `Consulta concluída: ${resultRows.length.toLocaleString('pt-BR')} datas retornadas pela NASA POWER.`
        );
      }
    } catch (e: any) {
      setError(
        Array.isArray(e?.response?.data?.message)
          ? e.response.data.message.join(' ')
          : e?.response?.data?.message ||
            'Não foi possível consultar a NASA POWER. Verifique o backend, os parâmetros e o período.'
      );
    } finally {
      setLoading(false);
    }
  }

  // Exportação CSV
  function exportCsv() {
    if (!rows.length) return;

    const content = [
      ['Data', ...selected],
      ...rows.map(row => [
        row.date,
        ...selected.map(code => row[code])
      ])
    ]
      .map(line => line.map(csvCell).join(';'))
      .join('\r\n');

    const url = URL.createObjectURL(
      new Blob(['\ufeff' + content], {
        type: 'text/csv;charset=utf-8'
      })
    );

    const a = document.createElement('a');
    a.href = url;
    a.download = `ctrlclima-relatorio-nasa-${start}-${end}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  // Exportação JSON
  function exportJson() {
    if (!rows.length) return;

    const payload = {
      source: 'NASA POWER',
      sourceUrl,
      latitude: Number(lat),
      longitude: Number(lon),
      start,
      end,
      community,
      parameters: parameters.filter(parameter =>
        selected.includes(parameter.code)
      ),
      rows
    };

    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json;charset=utf-8'
      })
    );

    const a = document.createElement('a');
    a.href = url;
    a.download = `ctrlclima-relatorio-nasa-${start}-${end}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  // Importação no banco: somente ADMIN
  async function importResults() {
    if (!isAdmin) {
      setError('Somente administradores podem importar dados.');
      return;
    }

    if (!rows.length) {
      setError('Realize uma consulta antes de importar os dados.');
      return;
    }

    const latitude = Number(lat);
    const longitude = Number(lon);

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      setError('Confira as coordenadas antes de importar.');
      return;
    }

    setImporting(true);
    setImportMessage('');
    setError('');

    const selectedCountry = countries.find(
      country => country.code === countryCode
    );

    try {
      const response = await api.post('/nasa/power/import', {
        latitude,
        longitude,
        start: toApiDate(start),
        end: toApiDate(end),
        parameters: selected.join(','),
        community,
        locationName: (
          placeQuery.trim() ||
          (
            selectedCountry
              ? `${selectedCountry.name} (ponto aproximado)`
              : `Ponto ${lat}, ${lon}`
          )
        ).slice(0, 120),
        country: selectedCountry?.name || 'Global'
      });

      setImportMessage(
        `${response.data.message} ${response.data.insertedCount} valor(es) novo(s) salvo(s); ${response.data.duplicatesSkipped} duplicado(s) ignorado(s). Abra a tela Medições para conferir.`
      );
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
        'Não foi possível salvar as medições. Confirme o schema Prisma e o perfil ADMIN.'
      );
    } finally {
      setImporting(false);
    }
  }

  // Cálculos estatísticos
  const summaries = selected.map(code => {
    const values = rows
      .map(row => row[code])
      .filter(
        (value): value is number =>
          typeof value === 'number' && Number.isFinite(value)
      );

    return {
      code,
      count: values.length,
      average: values.length
        ? values.reduce((a, b) => a + b, 0) / values.length
        : null,
      min: values.length ? Math.min(...values) : null,
      max: values.length ? Math.max(...values) : null
    };
  });

  const countryName = countries.find(
    country => country.code === countryCode
  )?.name;

  return (
    <div className="page-content reports-page">

      {/* Cabeçalho */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            DADOS VERIFICÁVEIS · EXPORTAÇÃO
          </div>

          <h1>Relatórios climáticos</h1>

          <p>
            Monte um relatório com dados diários da NASA POWER
            para localidades de todo o mundo.
          </p>
        </div>

        <span className="unit-pill">NASA POWER</span>
      </div>

      {/* Apresentação da fonte */}
      <div className="demo-banner">
        <Globe2 size={19} />

        <div>
          <strong>Consulta global por coordenadas</strong>

          <p>
            Os resultados são obtidos diretamente da API oficial NASA POWER.
            A cobertura e a disponibilidade variam por variável e período;
            temperatura do ar não é temperatura da superfície terrestre (LST).
          </p>
        </div>
      </div>

      {notice && (
        <div className="notice-banner" role="status">
          {notice}
        </div>
      )}

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      {/* Local e período */}
      <section className="filters-card">
        <div className="filter-title">
          <Search size={17} />
          <strong>1. Defina local e período</strong>
        </div>

        <div className="city-search-row">
          <div className="field">
            <label htmlFor="report-city">
              Pesquisar cidade ou localidade no mundo
            </label>

            <input
              id="report-city"
              value={placeQuery}
              onChange={e => setPlaceQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void searchPlaces();
                }
              }}
              placeholder="Ex.: Tóquio, Japão; Nairobi, Quênia"
            />
          </div>

          <button
            className="secondary-button city-search-button"
            type="button"
            disabled={placeLoading}
            onClick={() => void searchPlaces()}
          >
            <Search size={16} />

            {placeLoading ? 'Pesquisando…' : 'Pesquisar cidade'}
          </button>
        </div>

        {places.length > 0 && (
          <div
            className="place-results"
            role="listbox"
            aria-label="Resultados da pesquisa de cidades"
          >
            {places.map(place => (
              <button
                type="button"
                key={place.id}
                onClick={() => choosePlace(place)}
              >
                <strong>{place.name}</strong>

                <span>
                  {[place.admin1, place.country]
                    .filter(Boolean)
                    .join(', ')}
                </span>

                <small>
                  {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                </small>
              </button>
            ))}
          </div>
        )}

        <div className="filters-grid report-location-grid">

          <div className="field">
            <label htmlFor="report-country">
              País (centro geográfico aproximado)
            </label>

            <select
              id="report-country"
              value={countryCode}
              onChange={e => chooseCountry(e.target.value)}
            >
              <option value="">
                Coordenadas personalizadas / Rio de Janeiro
              </option>

              {countries.map((country, index) => (
                <option
                  key={`${country.code || 'country'}-${index}`}
                  value={country.code}
                >
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="report-lat">
              Latitude (-90 a 90)
            </label>

            <input
              id="report-lat"
              type="number"
              step="any"
              min="-90"
              max="90"
              value={lat}
              onChange={e => setLat(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="report-lon">
              Longitude (-180 a 180)
            </label>

            <input
              id="report-lon"
              type="number"
              step="any"
              min="-180"
              max="180"
              value={lon}
              onChange={e => setLon(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="report-start">
              Data inicial
            </label>

            <input
              id="report-start"
              type="date"
              value={start}
              max={end}
              onChange={e => setStart(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="report-end">
              Data final
            </label>

            <input
              id="report-end"
              type="date"
              value={end}
              min={start}
              onChange={e => setEnd(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="report-community">
              Comunidade de dados
            </label>

            <select
              id="report-community"
              value={community}
              onChange={e => setCommunity(e.target.value)}
            >
              <option value="AG">Agroclimatologia (AG)</option>
              <option value="RE">Energia renovável (RE)</option>
            </select>
          </div>

        </div>

        {countryName && (
          <p className="small-note report-country-note">
            Coordenadas preenchidas com o ponto geográfico aproximado
            informado pela REST Countries para {countryName}.
            Você pode ajustá-las ou pesquisar uma cidade acima.
          </p>
        )}
      </section>

      {/* Seleção de variáveis */}
      <section className="filters-card">
        <div className="filter-title">
          <Table2 size={17} />

          <strong>2. Selecione as variáveis</strong>

          <span className="unit-pill">
            {selected.length}/20 selecionadas
          </span>
        </div>

        <p className="muted report-intro">
          A NASA POWER permite até 20 parâmetros por requisição diária.
          Selecione apenas os indicadores relevantes para sua análise.
        </p>

        <div className="parameter-groups">
          {Object.entries(grouped).map(([group, items]) => (
            <fieldset className="parameter-group" key={group}>
              <legend>{group}</legend>

              <div className="parameter-options">
                {items.map(parameter => (
                  <label
                    key={parameter.code}
                    className={`parameter-option ${
                      selected.includes(parameter.code) ? 'checked' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(parameter.code)}
                      onChange={() => toggleParameter(parameter.code)}
                      disabled={
                        !selected.includes(parameter.code) &&
                        selected.length >= 20
                      }
                    />

                    <span>
                      <strong>{parameter.code}</strong>

                      <small>{parameter.label}</small>

                      <em>{parameter.unit}</em>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        <div className="report-actions">
          <button
            className="primary-button"
            disabled={loading || !selected.length}
            onClick={() => void runQuery()}
          >
            <Search size={17} />

            {loading
              ? 'Consultando NASA…'
              : 'Consultar e gerar relatório'}
          </button>

          <span className="muted">
            A consulta pode levar alguns segundos.
          </span>
        </div>
      </section>

      {/* Resultado da consulta */}
      {rows.length > 0 && (
        <>
          <section className="report-summary-grid">

            <article className="stat-card">
              <div className="stat-top">Datas retornadas</div>

              <strong className="stat-value">
                {rows.length.toLocaleString('pt-BR')}
              </strong>

              <span className="stat-note">
                Uma linha por dia com dados disponíveis
              </span>
            </article>

            <article className="stat-card">
              <div className="stat-top">Variáveis selecionadas</div>

              <strong className="stat-value">
                {selected.length}
              </strong>

              <span className="stat-note">
                Parâmetros pedidos à NASA POWER
              </span>
            </article>

            <article className="stat-card">
              <div className="stat-top">Período consultado</div>

              <strong className="stat-value report-date-value">
                {start} — {end}
              </strong>

              <span className="stat-note">
                Datas locais do relatório
              </span>
            </article>

          </section>

          {importMessage && (
            <div className="notice-banner" role="status">
              {importMessage}
            </div>
          )}

          {/* Resumo estatístico */}
          <section className="panel report-output">
            <div className="panel-heading">
              <div>
                <h2>Resumo estatístico descritivo</h2>

                <p>
                  Média, mínimo e máximo calculados sobre os valores
                  numéricos retornados; valores ausentes não entram na conta.
                </p>
              </div>

              <div className="report-export-actions">
                <button
                  className="secondary-button"
                  onClick={exportCsv}
                >
                  <Download size={16} />
                  CSV
                </button>

                <button
                  className="secondary-button"
                  onClick={exportJson}
                >
                  <FileJson size={16} />
                  JSON
                </button>

                <button
                  className="secondary-button"
                  onClick={() => window.print()}
                >
                  <Printer size={16} />
                  Imprimir / PDF
                </button>
              </div>
            </div>

            {/* Importação exclusiva do administrador */}
            {isAdmin && (
              <div className="import-actions">
                <button
                  className="primary-button"
                  disabled={importing}
                  onClick={() => void importResults()}
                >
                  <Download size={16} />

                  {importing
                    ? 'Salvando no banco…'
                    : 'Importar valores reais para o MySQL'}
                </button>

                <p className="small-note">
                  Importação disponível para administradores.
                  Máximo de cinco anos por operação; valores duplicados são ignorados.
                </p>
              </div>
            )}

            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Variável</th>
                    <th>Unidade</th>
                    <th>Valores válidos</th>
                    <th>Média</th>
                    <th>Mínimo</th>
                    <th>Máximo</th>
                  </tr>
                </thead>

                <tbody>
                  {summaries.map(summary => {
                    const parameter = parameters.find(
                      item => item.code === summary.code
                    );

                    return (
                      <tr key={summary.code}>
                        <td>
                          <strong>{summary.code}</strong>
                          <br />

                          <span className="table-secondary">
                            {parameter?.label}
                          </span>
                        </td>

                        <td>{parameter?.unit || '—'}</td>

                        <td>{summary.count}</td>

                        <td>
                          {summary.average == null
                            ? '—'
                            : summary.average.toLocaleString('pt-BR', {
                                maximumFractionDigits: 3
                              })}
                        </td>

                        <td>
                          {summary.min == null
                            ? '—'
                            : summary.min.toLocaleString('pt-BR', {
                                maximumFractionDigits: 3
                              })}
                        </td>

                        <td>
                          {summary.max == null
                            ? '—'
                            : summary.max.toLocaleString('pt-BR', {
                                maximumFractionDigits: 3
                              })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Dados diários */}
          <section className="panel report-output">
            <div className="panel-heading">
              <div>
                <h2>Dados diários retornados</h2>

                <p>
                  Prévia de até 200 linhas.
                  O CSV e o JSON exportam todos os registros retornados.
                </p>
              </div>

              <FileText size={19} />
            </div>

            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data</th>

                    {selected.map(code => (
                      <th key={code}>{code}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.slice(0, 200).map(row => (
                    <tr key={row.date}>
                      <td>{row.date}</td>

                      {selected.map(code => (
                        <td key={code}>
                          {typeof row[code] === 'number'
                            ? (row[code] as number).toLocaleString('pt-BR', {
                                maximumFractionDigits: 3
                              })
                            : 'Sem dado'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="chart-footnote">
              Fonte: NASA POWER Daily Point API.{' '}
              <a
                href="https://power.larc.nasa.gov/docs/services/api/temporal/daily/"
                target="_blank"
                rel="noreferrer"
              >
                Documentação oficial
              </a>
              .{' '}
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Abrir consulta da fonte
              </a>
              . O ponto de coordenadas representa uma célula/localidade
              de referência, não uma estação meteorológica exata.
            </p>
          </section>
        </>
      )}

      <p className="report-disclaimer">
        Relatório exploratório: consulte a documentação da NASA POWER
        para interpretar unidades, resolução espacial, fonte dos parâmetros
        e limitações. Os resumos estatísticos são descritivos e não comprovam
        causalidade nem significância científica.
      </p>

    </div>
  );
}
