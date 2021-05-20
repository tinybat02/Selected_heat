import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import Heatmap from 'ol/layer/Heatmap';

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
