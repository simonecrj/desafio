
import { useEffect, useState } from 'react';

import WorldMap from '../components/map/WorldMap';

import {
  getCountries,
  getNasaPower,
} from '../services/api';

import type {
  Country,
  NasaPowerResponse,
} from '../services/api';

type SelectedRegion = {
  name: string;
  properties: Record<string, any>;
  latitude: number;
  longitude: number;
};

export default function WorldMapPage() {
  const [selectedCountry, setSelectedCountry] =
    useState<Country | null>(null);

  const [selectedRegion, setSelectedRegion] =
    useState<SelectedRegion | null>(null);

  const [countries, setCountries] = useState<Country[]>([]);

  const [climate, setClimate] =
    useState<NasaPowerResponse | null>(null);

  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingClimate, setLoadingClimate] = useState(false);

  const [error, setError] = useState('');

  useEffect(() => {
    getCountries()
      .then(setCountries)
      .catch(() => {
        setError('Não foi possível carregar os países.');
      })
      .finally(() => {
        setLoadingCountries(false);
      });
  }, []);

  
useEffect(() => {
  if (!selectedCountry) return;

  const latitude = selectedRegion
    ? selectedRegion.latitude
    : selectedCountry.latitude;

  const longitude = selectedRegion
    ? selectedRegion.longitude
    : selectedCountry.longitude;

  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number'
  ) {
    setClimate(null);
    setError(
      'Não existem coordenadas disponíveis para esta região.',
    );
    return;
  }

  // Agora as coordenadas são reconhecidas como números.
  const nasaLatitude: number = latitude;
  const nasaLongitude: number = longitude;

  let active = true;

  async function loadClimate() {
    setLoadingClimate(true);
    setClimate(null);
    setError('');

    try {
      const result = await getNasaPower({
        latitude: nasaLatitude,
        longitude: nasaLongitude,
        start: '20250101',
        end: '20250107',
        parameters: 'T2M,T2M_MAX,T2M_MIN,RH2M,PRECTOTCORR',
        community: 'AG',
      });

      if (active) {
        setClimate(result);
      }
    } catch (err: any) {
      if (active) {
        setError(
          err.response?.data?.message ||
            'Não foi possível consultar os dados da NASA POWER.',
        );
      }
    } finally {
      if (active) {
        setLoadingClimate(false);
      }
    }
  }

  loadClimate();

  return () => {
    active = false;
  };
}, [selectedCountry, selectedRegion]);


  function handleSelectCountry(name: string) {
    const normalizedName = name.trim().toLowerCase();

    const country = countries.find(
      (item) =>
        item.name.trim().toLowerCase() === normalizedName ||
        item.officialName?.trim().toLowerCase() === normalizedName,
    );

    setSelectedRegion(null);
    setClimate(null);
    setError('');

    if (!country) {
      setSelectedCountry(null);
      setError(
        `Não foi possível localizar ${name} na lista de países.`,
      );
      return;
    }

    setSelectedCountry(country);
  }

  function handleSelectRegion(region: SelectedRegion) {
    setSelectedRegion(region);
  }

  function average(parameter: string) {
    if (!climate) return null;

    const values = climate.data
      .map((row) => row[parameter])
      .filter(
        (value): value is number =>
          typeof value === 'number' && Number.isFinite(value),
      );

    if (!values.length) return null;

    return (
      values.reduce((total, value) => total + value, 0) /
      values.length
    ).toFixed(1);
  }

  const indicators = [
    ['Temperatura média', 'T2M', '°C'],
    ['Temperatura máxima', 'T2M_MAX', '°C'],
    ['Temperatura mínima', 'T2M_MIN', '°C'],
    ['Umidade relativa', 'RH2M', '%'],
    ['Precipitação', 'PRECTOTCORR', 'mm/dia'],
  ];

  return (
    <section style={{ padding: 24 }}>
      <header style={{ marginBottom: 24 }}>
        <span
          style={{
            color: '#159b82',
            fontWeight: 700,
          }}
        >
          CTRLCLIMA · EARTH EXPLORER
        </span>

        <h1>Exploração climática mundial</h1>

        <p>
          Selecione um país e depois uma região no mapa para
          consultar seus indicadores climáticos.
        </p>
      </header>

      {loadingCountries ? (
        <p>Carregando países...</p>
      ) : (
        <WorldMap
          onSelectCountry={handleSelectCountry}
          onSelectRegion={handleSelectRegion}
        />
      )}

      <div
        style={{
          marginTop: 24,
          padding: 24,
          borderRadius: 16,
          background: 'var(--card, #ffffff)',
          border: '1px solid var(--border, #dddddd)',
        }}
      >
        <h2>
          {selectedRegion
            ? `${selectedRegion.name} — ${selectedCountry?.name}`
            : selectedCountry
              ? `${selectedCountry.flag || ''} ${selectedCountry.name}`
              : 'Explore os países'}
        </h2>

        {!selectedCountry && (
          <p>
            Clique em um país no mapa para consultar os dados
            climáticos.
          </p>
        )}

        {selectedCountry && (
          <>
            {selectedRegion && (
              <p>
                Região selecionada: {selectedRegion.name}
              </p>
            )}

            <p>
              Coordenadas:{' '}
              {selectedRegion?.latitude ??
                selectedCountry.latitude}
              ,{' '}
              {selectedRegion?.longitude ??
                selectedCountry.longitude}
            </p>

            <p>
              Período consultado: 01/01/2025 a 07/01/2025
            </p>

            {loadingClimate && (
              <p>Consultando dados da NASA POWER...</p>
            )}

            {error && (
              <p
                role="alert"
                style={{ color: '#d32f2f' }}
              >
                {error}
              </p>
            )}

            {climate && (
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: 16,
                    marginTop: 20,
                  }}
                >
                  {indicators.map(([label, code, unit]) => {
                    const value = average(code);

                    return (
                      <div
                        key={code}
                        style={{
                          padding: 18,
                          borderRadius: 20,
                          background:
                            'var(--surface-secondary, #f3f5f5)',
                        }}
                      >
                        <strong>{label}</strong>

                        <h2>
                          {value ?? 'Sem dados'}
                          {value !== null ? ` ${unit}` : ''}
                        </h2>
                      </div>
                    );
                  })}
                </div>

                <p
                  style={{
                    marginTop: 50,
                    fontSize: 13,
                  }}
                >
                  Fonte: {climate.attribution}
                </p>

                <p style={{ fontSize: 13 }}>
                  {climate.note}
                </p>

                <p style={{ fontSize: 13 }}>
                  Os valores representam os registros disponíveis
                  para as coordenadas consultadas. Eles não
                  correspondem necessariamente à média de todo
                  o território da região selecionada.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}




