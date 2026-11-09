


import { api } from './api';

const WORLD_GEOJSON_URL =
  'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';

export async function getWorldCountries() {
  const response = await fetch(WORLD_GEOJSON_URL);

  if (!response.ok) {
    throw new Error('Não foi possível carregar os países do mapa.');
  }

  return response.json();
}

export type AdministrativeLevel =
  | 'ADM1'
  | 'ADM2'
  | 'ADM3'
  | 'ADM4'
  | 'ADM5';

export interface AdministrativeBoundaryResponse {
  countryCode: string;
  level: AdministrativeLevel;
  name: string;
  year?: string;
  source: string;
  license?: string;
  attribution: string;
  geojson: any;
}

export async function getAdministrativeBoundaries(
  countryCode: string,
  level: AdministrativeLevel = 'ADM1',
): Promise<AdministrativeBoundaryResponse> {
  const response = await api.get<AdministrativeBoundaryResponse>(
    `/boundaries/${countryCode}`,
    { params: { level } },
  );

  return response.data;
}
