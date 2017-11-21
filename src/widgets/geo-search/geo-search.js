import cx from 'classnames';
import { bemHelper } from '../../lib/utils.js';
import connectGeoSearch from '../../connectors/geo-search/connectGeoSearch';
import GoogleMapsRenderer from './GoogleMapsRenderer';
import LeafletRenderer from './LeafletRenderer';
import MapboxRenderer from './MapboxRenderer';

const bem = bemHelper('ais-geo');

// type Position = {
//   top: number,
//   right: number,
//   bottom: number,
//   left: number,
// };
//
// type CSSClasses = {
//   // TBD
// };
//
// type Templates = {
//   // TBD
// };
//
// type MapOptions = {
//   // TBD
// };
//
// type MarkerOptions = {
//   // TBD
// };
//
// type WidgetOptions = {
//   initialZoom: number,
//   enableRefineControl: boolean,
//   paddingBoundingBox: Position,
//   cssClasses: CSSClasses,
//   templates: Templates,
//   mapOptions?: MapOptions,
//   markerOptions?: MarkerOptions,
//   enableGeolocationWithIP?: boolean,
//   enableRefineOnMapMove?: boolean,
//   initialPosition?: LatLng,
//   position?: LatLng,
//   radius?: number | 'all',
//   minRadius?: number,
//   precision?: number,
// };

const geoSearch = renderer => (props = {}) => {
  const widgetParams = {
    enableRefineControl: true,
    cssClasses: {},
    paddingBoundingBox: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    ...props,
  };

  if (!widgetParams.container) {
    throw new Error(`Must provide a container.`);
  }

  try {
    const makeGeoSearch = connectGeoSearch(renderer);

    return makeGeoSearch({
      ...widgetParams,
      renderState: {},
      cssClasses: {
        root: cx(bem(null), widgetParams.cssClasses.root),
        item: cx(bem('item'), widgetParams.cssClasses.item),
        empty: cx(bem(null, 'empty'), widgetParams.cssClasses.empty),
      },
    });
  } catch (e) {
    throw new Error(`See usage.`);
  }
};

export const geoSearchWithGoogleMaps = geoSearch(GoogleMapsRenderer);
export const geoSearchWithLeaflet = geoSearch(LeafletRenderer);
export const geoSearchWithMapbox = geoSearch(MapboxRenderer);
