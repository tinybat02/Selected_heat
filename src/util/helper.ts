import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Heatmap from 'ol/layer/Heatmap';
import { Coordinate } from 'ol/coordinate';
import { Circle as CircleStyle, Stroke, Style, Fill, Text } from 'ol/style';

interface Record {
  latitude: number;
  longitude: number;
  [key: string]: any;
}

export const processData = (data: Record[]) => {
  data.reverse();

  const perDeviceRoute: { [key: string]: [number, number][] } = {};

  data.map(datum => {
    if (perDeviceRoute[datum.hash_id]) {
      perDeviceRoute[datum.hash_id].push([datum.longitude, datum.latitude]);
    } else {
      perDeviceRoute[datum.hash_id] = [[datum.longitude, datum.latitude]];
    }
  });

  return { perDeviceRoute };
};

export const createHeatLayer = (data: [number, number][]) => {
  const features = data.map(point => new Feature(new Point(point).transform('EPSG:4326', 'EPSG:3857')));

  return new Heatmap({
    source: new VectorSource({
      features: features,
    }),
    blur: 15,
    radius: 5,
    opacity: 0.9,
    zIndex: 2,
  });
};

export const createPointLayer = (latlon: Coordinate, label: string) => {
  const pointFeature = new Feature(new Point(latlon).transform('EPSG:4326', 'EPSG:3857'));

  return new VectorLayer({
    source: new VectorSource({
      features: [pointFeature],
    }),
    style: new Style({
      image: new CircleStyle({
        radius: 5,
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.7)',
        }),
        stroke: new Stroke({
          color: '#00b2ae',
          width: 2,
        }),
      }),
      text: new Text({
        stroke: new Stroke({
          color: '#fff',
          width: 2,
        }),
        font: '14px Calibri,sans-serif',
        text: label,
        offsetY: -12,
      }),
    }),
    zIndex: 3,
  });
};
