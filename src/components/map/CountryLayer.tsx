
import { GeoJSON } from 'react-leaflet';

type CountryLayerProps = {
  data: any;
  onSelectCountry: (name: string, code3?: string) => void;
};

export default function CountryLayer({
  data,
  onSelectCountry,
}: CountryLayerProps) {
  return (
    <GeoJSON
      data={data}
      style={() => ({
        color: '#ffffff',
        weight: 1,
        fillColor: '#159b82',
        fillOpacity: 0.55,
      })}
      eventHandlers={{
        mouseover: (event) => {
          event.layer.setStyle({
            fillColor: '#38c7a7',
            fillOpacity: 0.85,
            weight: 2,
          });
        },
        mouseout: (event) => {
          event.layer.setStyle({
            fillColor: '#159b82',
            fillOpacity: 0.55,
            weight: 1,
          });
        },
        click: (event) => {
          const properties = event.layer.feature?.properties || {};

          const name =
            properties.ADMIN ||
            properties.name ||
            properties.NAME ||
            properties.SOVEREIGNT ||
            'País não identificado';

          const code3 =
            properties.ISO3166_1_ALPHA_3 ||
            properties.ISO_A3 ||
            properties.ADM0_A3 ||
            properties.iso_a3 ||
            properties['ISO3166-1-Alpha-3'];

          onSelectCountry(name, code3);
        },
      }}
    />
  );
}
