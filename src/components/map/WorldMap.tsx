
import { useEffect, useState } from 'react';

import {
  MapContainer,
  TileLayer,
  useMap,
} from 'react-leaflet';

import type {
  LatLngExpression,
  LatLngBounds,
} from 'leaflet';

import CountryLayer from './CountryLayer';
import AdministrativeLayer from './AdministrativeLayer';

import {
  getWorldCountries,
  getAdministrativeBoundaries,
} from '../../services/mapService';

import type {
  AdministrativeBoundaryResponse,
} from '../../services/mapService';

import 'leaflet/dist/leaflet.css';

type SelectedRegion = {
  name: string;
  properties: Record<string, any>;
  latitude: number;
  longitude: number;
};

type WorldMapProps = {
  onSelectCountry: (name: string) => void;
  onSelectRegion: (region: SelectedRegion) => void;
};

// Controla a aproximação automática do mapa.
function MapViewController({
  bounds,
}: {
  bounds: LatLngBounds | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, {
        padding: [35, 35],
        maxZoom: 6,
        animate: true,
        duration: 0.8,
      });
    }
  }, [bounds, map]);

  return null;
}

export default function WorldMap({
  onSelectCountry,
  onSelectRegion,
}: WorldMapProps) {
  const [countries, setCountries] = useState<any>(null);

  const [administrativeData, setAdministrativeData] =
    useState<AdministrativeBoundaryResponse | null>(null);

  const [selectedCountryName, setSelectedCountryName] =
    useState('');

  const [selectedCountryCode, setSelectedCountryCode] =
    useState('');

  const [selectedRegionName, setSelectedRegionName] =
    useState('');

  const [selectedRegionBounds, setSelectedRegionBounds] =
    useState<LatLngBounds | null>(null);

  const [loadingBoundaries, setLoadingBoundaries] =
    useState(false);

  const [error, setError] = useState('');

  // Carrega o mapa mundial.
  useEffect(() => {
    getWorldCountries()
      .then(setCountries)
      .catch(() => {
        setError(
          'Não foi possível carregar o mapa. Verifique sua conexão.',
        );
      });
  }, []);

  // Seleciona um país e carrega suas divisões ADM1.
  async function handleSelectCountry(
    name: string,
    code3?: string,
  ) {
    onSelectCountry(name);

    setSelectedRegionName('');
    setSelectedRegionBounds(null);
    setAdministrativeData(null);

    if (!code3 || code3 === '-99') {
      setSelectedCountryName(name);
      setSelectedCountryCode('');
      setError(
        'Não foi possível identificar o código ISO3 deste país para carregar suas divisões administrativas.',
      );
      return;
    }

    setSelectedCountryName(name);
    setSelectedCountryCode(code3);
    setError('');
    setLoadingBoundaries(true);

    try {
      // Carrega estados ou divisões equivalentes.
      const result = await getAdministrativeBoundaries(
        code3,
        'ADM1',
      );

      setAdministrativeData(result);

      // Identifica a primeira divisão ADM1.
      const firstAdm1 =
        result.geojson.type === 'FeatureCollection'
          ? result.geojson.features?.[0]
          : result.geojson;

      console.log('PAÍS SELECIONADO:', name);

      console.log(
        'PROPRIEDADES ADM1:',
        JSON.stringify(firstAdm1?.properties, null, 2),
      );

      console.log(
        'QUANTIDADE ADM1:',
        result.geojson.features?.length ?? 1,
      );

      // Consulta temporária dos municípios do Brasil (ADM2).
      if (code3 === 'BRA') {
        try {
          const municipalities =
            await getAdministrativeBoundaries(
              code3,
              'ADM2',
            );

          const firstAdm2 =
            municipalities.geojson.type === 'FeatureCollection'
              ? municipalities.geojson.features?.[0]
              : municipalities.geojson;

          console.log(
            'PROPRIEDADES ADM2:',
            JSON.stringify(firstAdm2?.properties, null, 2),
          );

          console.log(
            'QUANTIDADE ADM2:',
            municipalities.geojson.features?.length ?? 1,
          );

        } catch (error) {
          console.error(
            'ERRO AO CARREGAR ADM2:',
            error,
          );
        }
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Não foi possível carregar as divisões administrativas deste país.',
      );
    } finally {
      setLoadingBoundaries(false);
    }
  }

  // Seleciona uma região no mapa.
  function handleSelectRegion(region: {
    name: string;
    properties: Record<string, any>;
    bounds: LatLngBounds;
  }) {
    setSelectedRegionName(region.name);
    setSelectedRegionBounds(region.bounds);

    const center = region.bounds.getCenter();

    onSelectRegion({
      name: region.name,
      properties: region.properties,
      latitude: center.lat,
      longitude: center.lng,
    });
  }

  // Retorna à visualização mundial.
  function handleBackToWorld() {
    setSelectedCountryName('');
    setSelectedCountryCode('');
    setSelectedRegionName('');
    setSelectedRegionBounds(null);
    setAdministrativeData(null);
    setLoadingBoundaries(false);
    setError('');

    onSelectCountry('');
  }

  const center: LatLngExpression = [15, 0];

  if (error && !countries) {
    return <p role="alert">{error}</p>;
  }

  if (!countries) {
    return <p>Carregando mapa mundial...</p>;
  }

  return (
    <section>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 16,
        }}
      >
        <div>
          <strong>
            {selectedRegionName
              ? `Explorando: ${selectedRegionName}`
              : selectedCountryName
                ? `Explorando: ${selectedCountryName}`
                : 'Exploração mundial'}
          </strong>

          {selectedCountryCode && (
            <p
              style={{
                margin: '4px 0',
                fontSize: 13,
              }}
            >
              Código ISO3: {selectedCountryCode}
            </p>
          )}

          {selectedCountryName && !selectedRegionName && (
            <p
              style={{
                margin: '4px 0',
                fontSize: 13,
              }}
            >
              Selecione uma região no mapa.
            </p>
          )}
        </div>

        {selectedCountryName && (
          <button
            type="button"
            onClick={handleBackToWorld}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #159b82',
              background: '#159b82',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            Voltar ao mapa mundial
          </button>
        )}
      </div>

      {loadingBoundaries && (
        <p>Carregando divisões administrativas...</p>
      )}

      {error && (
        <p
          role="alert"
          style={{ color: '#d32f2f' }}
        >
          {error}
        </p>
      )}

      <div
        style={{
          width: '100%',
          height: '600px',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <MapContainer
          key={selectedCountryCode || 'world'}
          center={center}
          zoom={2}
          minZoom={2}
          maxZoom={10}
          scrollWheelZoom
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapViewController
            bounds={selectedRegionBounds}
          />

          {!selectedCountryName && (
            <CountryLayer
              data={countries}
              onSelectCountry={handleSelectCountry}
            />
          )}

          {administrativeData && (
            <AdministrativeLayer
              data={administrativeData.geojson}
              selectedRegionName={selectedRegionName}
              onSelectRegion={handleSelectRegion}
            />
          )}
        </MapContainer>
      </div>

      {selectedRegionName && (
        <p
          style={{
            marginTop: 12,
            fontSize: 13,
            color: 'var(--text-secondary, #666)',
          }}
        >
          Região selecionada:{' '}
          <strong>{selectedRegionName}</strong>.
          Clique em outra região para comparar sua localização.
        </p>
      )}
    </section>
  );
}
