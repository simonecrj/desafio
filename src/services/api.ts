
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('calor_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
export type UserRole = 'ADMIN' | 'RESEARCHER';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};


export type Region = {
  id: number;
  name: string;
  state?: string | null;
  country: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  description?: string | null;
  _count?: {
    measurements?: number;
    airTemperatures?: number;
    climateObservations?: number;
  };
};

export type Measurement = {
  id: number;
  regionId: number;
  observedAt: string;
  surfaceTempC: string | number;
  source: string;
  productCode?: string | null;
  isDemo: boolean;
  region: {
    id: number;
    name: string;
    state?: string | null;
  };
};

export type TrendPoint = {
  date: string;
  year: number;
  temperatureC: number;
  source: string;
  isDemo: boolean;
};

export type TrendSeries = {
  regionId: number;
  region: {
    id: number;
    name: string;
    state?: string | null;
  };
  count: number;
  points: TrendPoint[];
  trendCPerYear: number;
  trendCPerDecade: number;
  firstValueC: number | null;
  lastValueC: number | null;
  differenceC: number | null;
  statisticalSignificance: string;
  methodologyNote: string;
  parameterCode?: string;
  unit?: string;
};

export type ClimateObservation = {
  id: number;
  regionId: number;
  observedAt: string;
  parameterCode: string;
  value: number | string;
  unit: string;
  source: string;
  productCode?: string | null;
  community?: string | null;
  isDemo: boolean;
  qualityNote?: string | null;
  region?: {
    id: number;
    name: string;
    state?: string | null;
    country?: string | null;
  };
};

export type ClimateParameter = {
  code: string;
  label: string;
  unit: string;
  group: string;
};

export type Country = {
  code: string | null;
  code3: string | null;
  name: string;
  officialName: string | null;
  capital: string | null;
  region: string;
  subregion: string | null;
  population: number | null;
  area: number | null;
  flag: string | null;
  latitude: number | null;
  longitude: number | null;
  continents: string[];
};
export type NasaPowerResponse = {
  source: string;
  sourceUrl: string;
  attribution: string;
  community: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  period: {
    start: string;
    end: string;
  };
  parameters: {
    code: string;
    label: string;
    unit: string;
    group: string;
  }[];
  data: Record<string, string | number | null>[];
  messages: string[];
  returnedRows: number;
  note: string;
};

export async function getNasaPower(params: {
  latitude: number;
  longitude: number;
  start: string;
  end: string;
  parameters?: string;
  community?: 'AG' | 'RE';
}) {
  const response = await api.get<NasaPowerResponse>(
    '/nasa/power',
    {
      params: {
        ...params,
        parameters: params.parameters || 'T2M,T2M_MAX,T2M_MIN',
        community: params.community || 'AG',
      },
    },
  );

  return response.data;
}
export async function getCountries() {
  const response = await api.get<Country[]>('/countries');
  return response.data;
}