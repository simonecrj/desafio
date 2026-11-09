
import { GeoJSON } from 'react-leaflet';

type AdministrativeLayerProps = {
  data: any;
  selectedRegionName?: string;
  onSelectRegion?: (region: {
    name: string;
    properties: Record<string, any>;
    bounds: any;
  }) => void;
};

function getRegionName(properties: Record<string, any>) {
  return (
    properties.shapeName ||
    properties.NAME_1 ||
    properties.name ||
    properties.NAME ||
    properties.name_1 ||
    'Região não identificada'
  );
}

export default function AdministrativeLayer({
  data,
  selectedRegionName,
  onSelectRegion,
}: AdministrativeLayerProps) {
  return (
    <GeoJSON
      data={data}
      style={(feature) => {
        const properties = feature?.properties || {};
        const name = getRegionName(properties);
        const isSelected =
          name === selectedRegionName;

        return {
          color: isSelected ? '#075e50' : '#ffffff',
          weight: isSelected ? 3 : 1.5,
          fillColor: isSelected ? '#f2c14e' : '#159b82',
          fillOpacity: isSelected ? 0.8 : 0.45,
        };
      }}
      eventHandlers={{
        mouseover: (event) => {
          const properties =
            event.layer.feature?.properties || {};

          const name = getRegionName(properties);

          if (name !== selectedRegionName) {
            event.layer.setStyle({
              fillColor: '#38c7a7',
              fillOpacity: 0.75,
              weight: 2,
            });
          }
        },

        mouseout: (event) => {
          const properties =
            event.layer.feature?.properties || {};

          const name = getRegionName(properties);
          const isSelected = name === selectedRegionName;

          event.layer.setStyle({
            color: isSelected ? '#075e50' : '#ffffff',
            weight: isSelected ? 3 : 1.5,
            fillColor: isSelected ? '#f2c14e' : '#159b82',
            fillOpacity: isSelected ? 0.8 : 0.45,
          });
        },

        click: (event) => {
          const feature = event.layer.feature;
          const properties = feature?.properties || {};
          const name = getRegionName(properties);

          onSelectRegion?.({
            name,
            properties,
            bounds: event.layer.getBounds(),
          });
        },
      }}
    />
  );
}
