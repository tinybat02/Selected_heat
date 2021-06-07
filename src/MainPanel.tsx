import React, { PureComponent } from 'react';
import { PanelProps } from '@grafana/data';
import { PanelOptions, Buffer } from 'types';
import { Map, View } from 'ol';
import XYZ from 'ol/source/XYZ';
import { Tile as TileLayer } from 'ol/layer';
import { fromLonLat } from 'ol/proj';
import { defaults, DragPan, MouseWheelZoom } from 'ol/interaction';
import { platformModifierKeyOnly } from 'ol/events/condition';
import Heatmap from 'ol/layer/Heatmap';
import { nanoid } from 'nanoid';
import { processData, createHeatLayer, create_dev_diff } from './util/helper';
import 'ol/ol.css';
import VectorLayer from 'ol/layer/Vector';

interface Props extends PanelProps<PanelOptions> {}
interface State {
  options: string[];
  current: string;
}

export class MainPanel extends PureComponent<Props, State> {
  id = 'id' + nanoid();
  map: Map;
  randomTile: TileLayer;
  heatLayer: Heatmap;
  deviceLayer: VectorLayer;
  perDevice: {
    [key: string]: {
      point1: [number, number];
      point2: [number, number];
      heat_coord: [number, number][];
      distance: number;
    };
  } = {};

  state: State = {
    options: [],
    current: 'None',
  };

  componentDidMount() {
    const { tile_url, zoom_level, center_lon, center_lat } = this.props.options;

    const carto = new TileLayer({
      source: new XYZ({
        url: 'https://{1-4}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      }),
    });
    this.map = new Map({
      interactions: defaults({ dragPan: false, mouseWheelZoom: false, onFocusOnly: true }).extend([
        new DragPan({
          condition: function(event) {
            return platformModifierKeyOnly(event) || this.getPointerCount() === 2;
          },
        }),
        new MouseWheelZoom({
          condition: platformModifierKeyOnly,
        }),
      ]),
      layers: [carto],
      view: new View({
        center: fromLonLat([center_lon, center_lat]),
        zoom: zoom_level,
      }),
      target: this.id,
    });

    if (tile_url !== '') {
      this.randomTile = new TileLayer({
        source: new XYZ({
          url: tile_url,
        }),
        zIndex: 1,
      });
      this.map.addLayer(this.randomTile);
    }

    if (this.props.data.series.length > 0) {
      const { buffer } = this.props.data.series[0].fields[0].values as Buffer;
      const { perDevice } = processData(buffer);
      this.perDevice = perDevice;
      this.setState({ options: Object.keys(perDevice) });
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevProps.data.series[0] !== this.props.data.series[0]) {
      this.map.removeLayer(this.heatLayer);
      this.map.removeLayer(this.deviceLayer);

      if (this.props.data.series.length == 0) {
        this.setState({ options: [], current: 'None' });
        this.perDevice = {};
        return;
      }

      const { buffer } = this.props.data.series[0].fields[0].values as Buffer;
      const { perDevice } = processData(buffer);
      this.perDevice = perDevice;
      this.setState({ options: Object.keys(perDevice) });

      const { current } = this.state;
      if (current != 'None' && perDevice[current]) {
        this.heatLayer = createHeatLayer(perDevice[current].heat_coord);
        this.map.addLayer(this.heatLayer);

        this.deviceLayer = create_dev_diff(perDevice[current], current);
        this.map.addLayer(this.deviceLayer);
      }
    }

    if (prevProps.options.tile_url !== this.props.options.tile_url) {
      this.map.removeLayer(this.randomTile);

      if (this.props.options.tile_url !== '') {
        this.randomTile = new TileLayer({
          source: new XYZ({
            url: this.props.options.tile_url,
          }),
          zIndex: 1,
        });
        this.map.addLayer(this.randomTile);
      }
    }

    if (prevProps.options.zoom_level !== this.props.options.zoom_level)
      this.map.getView().setZoom(this.props.options.zoom_level);

    if (
      prevProps.options.center_lat !== this.props.options.center_lat ||
      prevProps.options.center_lon !== this.props.options.center_lon
    )
      this.map.getView().animate({
        center: fromLonLat([this.props.options.center_lon, this.props.options.center_lat]),
        duration: 2000,
      });

    if (prevState.current !== this.state.current) {
      this.map.removeLayer(this.heatLayer);
      this.map.removeLayer(this.deviceLayer);
      if (this.state.current == 'None') return;

      this.heatLayer = createHeatLayer(this.perDevice[this.state.current].heat_coord);
      this.map.addLayer(this.heatLayer);

      this.deviceLayer = create_dev_diff(this.perDevice[this.state.current], this.state.current);
      this.map.addLayer(this.deviceLayer);

      // if (!this.props.options.geojson) return;

      // const device_local = this.props.options.geojson.features.find(point => {
      //   const id = point.properties?.id as string;
      //   return id.replace(':', '').toLowerCase() == this.state.current;
      // });

      // if (device_local) {
      //   //@ts-ignore
      //   this.deviceLayer = createPointLayer(device_local.geometry.coordinates, this.state.current);
      //   this.map.addLayer(this.deviceLayer);
      // }
    }
  }

  handleSelector = (e: React.ChangeEvent<HTMLSelectElement>) => {
    this.setState({ current: e.target.value });
  };

  render() {
    const { width, height } = this.props;
    const { options, current } = this.state;

    return (
      <div
        style={{
          width,
          height,
          padding: 10,
        }}
      >
        <select id="selector" style={{ width: 350 }} onChange={this.handleSelector} value={current}>
          <option value="None">None</option>
          {options.map(item => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <div id={this.id} style={{ width, height: height - 40 }}></div>
      </div>
    );
  }
}
