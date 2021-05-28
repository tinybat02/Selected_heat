import { DataFrame, Field, Vector } from '@grafana/data';
import { GeoJSONFeatureCollection } from 'ol/format/GeoJSON';

export interface PanelOptions {
  center_lat: number;
  center_lon: number;
  tile_url: string;
  zoom_level: number;
  geojson: GeoJSONFeatureCollection | null;
}

export const defaults: PanelOptions = {
  center_lat: 48.262725,
  center_lon: 11.66725,
  tile_url: '',
  zoom_level: 18,
  geojson: null,
};

export interface Buffer extends Vector {
  buffer: any;
}

export interface FieldBuffer extends Field<any, Vector> {
  values: Buffer;
}

export interface Frame extends DataFrame {
  fields: FieldBuffer[];
}
