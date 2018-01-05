import noop from 'lodash/noop';
import { render } from 'preact-compat';
import renderer from '../GeoSearchRenderer';

jest.mock('preact-compat', () => {
  const module = require.requireActual('preact-compat');

  module.render = jest.fn();

  return module;
});

const createFakeMapInstance = () => ({
  addListener: jest.fn(),
  setCenter: jest.fn(),
  setZoom: jest.fn(),
  getBounds: jest.fn(() => ({
    getNorthEast: jest.fn(),
    getSouthWest: jest.fn(),
  })),
  getZoom: jest.fn(),
  getProjection: jest.fn(() => ({
    fromPointToLatLng: jest.fn(() => ({
      lat: jest.fn(),
      lng: jest.fn(),
    })),
    fromLatLngToPoint: jest.fn(() => ({
      x: 0,
      y: 0,
    })),
  })),
  fitBounds: jest.fn(),
});

const createFakeMarkerInstance = () => ({
  setMap: jest.fn(),
  getPosition: jest.fn(),
});

const createFakeModalInstance = () => ({
  open: jest.fn(),
  close: jest.fn(),
});

const createFakeGoogleInstance = (
  {
    mapInstance = createFakeMapInstance(),
    markerInstance = createFakeMarkerInstance(),
    modalInstance = createFakeModalInstance(),
  } = {}
) => ({
  maps: {
    LatLngBounds: jest.fn(() => ({
      extend: jest.fn().mockReturnThis(),
    })),
    Map: jest.fn(() => mapInstance),
    Marker: jest.fn(args => ({
      ...args,
      ...markerInstance,
    })),
    InfoWindow: jest.fn(args => ({
      ...args,
      ...modalInstance,
    })),
    ControlPosition: {
      LEFT_TOP: 'left:top',
    },
    event: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
});

const createFakeWidgetParams = options => ({
  container: document.createElement('div'),
  googleInstance: createFakeGoogleInstance(),
  renderState: {},
  cssClasses: {
    root: 'root',
    map: 'map',
    controls: 'controls',
  },
  enableClearMapRefinement: true,
  enableRefineControl: true,
  paddingBoundingBox: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  createMarkerOptions: noop,
  createModalOptions: noop,
  ...options,
});

const createFakeRenderOptions = options => ({
  items: [],
  refine: jest.fn(),
  clearMapRefinement: jest.fn(),
  toggleRefineOnMapMove: jest.fn(),
  isRefineOnMapMove: jest.fn(() => true),
  setMapMoveSinceLastRefine: jest.fn(),
  hasMapMoveSinceLastRefine: jest.fn(() => false),
  isRefinedWithMap: jest.fn(() => false),
  widgetParams: createFakeWidgetParams(),
  instantSearchInstance: {
    templatesConfig: {},
  },
  ...options,
});

describe('GeoSearchRenderer - init', () => {
  const isFirstRendering = true;

  it('expect to create the DOM', () => {
    const params = createFakeRenderOptions();

    renderer(params, isFirstRendering);

    expect(params.widgetParams.container.innerHTML).toMatchSnapshot();
  });

  it('expect to instantiate the map with default options', () => {
    const googleInstance = createFakeGoogleInstance();
    const params = createFakeRenderOptions({
      widgetParams: createFakeWidgetParams({
        googleInstance,
      }),
    });

    renderer(params, isFirstRendering);

    expect(googleInstance.maps.Map).toHaveBeenCalledWith(expect.anything(), {
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      clickableIcons: false,
      zoomControlOptions: {
        position: 'left:top',
      },
    });
  });

  it('expect to instantiate the map with given options', () => {
    const googleInstance = createFakeGoogleInstance();
    const params = createFakeRenderOptions({
      widgetParams: createFakeWidgetParams({
        googleInstance,
        mapOptions: {
          otherMapSpecific: 'value',
          clickableIcons: true,
          zoomControlOptions: {
            position: 'right:bottom',
          },
        },
      }),
    });

    renderer(params, isFirstRendering);

    expect(googleInstance.maps.Map).toHaveBeenCalledWith(expect.anything(), {
      otherMapSpecific: 'value',
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      clickableIcons: true,
      zoomControlOptions: {
        position: 'right:bottom',
      },
    });
  });

  describe('setup map events', () => {
    it('expect to listen for "center_changed" and trigger setMapMoveSinceLastRefine on user interaction', () => {
      const mapInstance = createFakeMapInstance();
      const googleInstance = createFakeGoogleInstance({ mapInstance });
      const params = createFakeRenderOptions({
        widgetParams: createFakeWidgetParams({
          googleInstance,
        }),
      });

      renderer(params, isFirstRendering);

      // Simulate center_changed event
      mapInstance.addListener.mock.calls[0][1]();

      expect(mapInstance.addListener).toHaveBeenCalledWith(
        'center_changed',
        expect.any(Function)
      );

      expect(params.setMapMoveSinceLastRefine).toHaveBeenCalled();
    });

    it('expect to listen for "center_changed" and do not trigger on programmatic interaction', () => {
      const mapInstance = createFakeMapInstance();
      const googleInstance = createFakeGoogleInstance({ mapInstance });
      const params = createFakeRenderOptions({
        widgetParams: createFakeWidgetParams({
          googleInstance,
        }),
      });

      renderer(params, isFirstRendering);

      // Simulate programmatic event
      params.widgetParams.renderState.isUserInteraction = false;

      // Simulate center_changed event
      mapInstance.addListener.mock.calls[0][1]();

      expect(mapInstance.addListener).toHaveBeenCalledWith(
        'center_changed',
        expect.any(Function)
      );

      expect(params.setMapMoveSinceLastRefine).not.toHaveBeenCalled();
    });

    it('expect to listen for "zoom_changed", trigger setMapMoveSinceLastRefine and schedule a refine call on user interaction', () => {
      const mapInstance = createFakeMapInstance();
      const googleInstance = createFakeGoogleInstance({ mapInstance });
      const params = createFakeRenderOptions({
        widgetParams: createFakeWidgetParams({
          googleInstance,
        }),
      });

      renderer(params, isFirstRendering);

      // Simulate center_changed event
      mapInstance.addListener.mock.calls[1][1]();

      expect(mapInstance.addListener).toHaveBeenCalledWith(
        'zoom_changed',
        expect.any(Function)
      );

      expect(params.widgetParams.renderState.isPendingRefine).toBe(true);
      expect(params.setMapMoveSinceLastRefine).toHaveBeenCalled();
    });

    it('expect to listen for "zoom_changed" and do not trigger on programmatic interaction', () => {
      const mapInstance = createFakeMapInstance();
      const googleInstance = createFakeGoogleInstance({ mapInstance });
      const params = createFakeRenderOptions({
        widgetParams: createFakeWidgetParams({
          googleInstance,
        }),
      });

      renderer(params, isFirstRendering);

      // Simulate programmatic event
      params.widgetParams.renderState.isUserInteraction = false;

      // Simulate center_changed event
      mapInstance.addListener.mock.calls[1][1]();

      expect(mapInstance.addListener).toHaveBeenCalledWith(
        'zoom_changed',
        expect.any(Function)
      );

      expect(params.widgetParams.renderState.isPendingRefine).toBe(false);
      expect(params.setMapMoveSinceLastRefine).not.toHaveBeenCalled();
    });

    it('expect to listen for "dragstart" and schedule a refine call on user interaction', () => {
      const mapInstance = createFakeMapInstance();
      const googleInstance = createFakeGoogleInstance({ mapInstance });
      const params = createFakeRenderOptions({
        widgetParams: createFakeWidgetParams({
          googleInstance,
        }),
      });

      renderer(params, isFirstRendering);

      // Simulate center_changed event
      mapInstance.addListener.mock.calls[2][1]();

      expect(mapInstance.addListener).toHaveBeenCalledWith(
        'dragstart',
        expect.any(Function)
      );

      expect(params.widgetParams.renderState.isPendingRefine).toBe(true);
    });

    it('expect to listen for "dragstart" and do not trigger on programmatic interaction', () => {
      const mapInstance = createFakeMapInstance();
      const googleInstance = createFakeGoogleInstance({ mapInstance });
      const params = createFakeRenderOptions({
        widgetParams: createFakeWidgetParams({
          googleInstance,
        }),
      });

      renderer(params, isFirstRendering);

      // Simulate programmatic event
      params.widgetParams.renderState.isUserInteraction = false;

      // Simulate center_changed event
      mapInstance.addListener.mock.calls[2][1]();

      expect(mapInstance.addListener).toHaveBeenCalledWith(
        'dragstart',
        expect.any(Function)
      );

      expect(params.widgetParams.renderState.isPendingRefine).toBe(false);
    });

    it('expect to listen for "idle", call refine and reset the scheduler', () => {
      const mapInstance = createFakeMapInstance();
      const googleInstance = createFakeGoogleInstance({ mapInstance });
      const params = createFakeRenderOptions({
        widgetParams: createFakeWidgetParams({
          googleInstance,
        }),
      });

      renderer(params, isFirstRendering);

      // Simulate pending refine
      params.widgetParams.renderState.isPendingRefine = true;

      // Simulate center_changed event
      mapInstance.addListener.mock.calls[3][1]();

      expect(mapInstance.addListener).toHaveBeenCalledWith(
        'idle',
        expect.any(Function)
      );

      expect(params.widgetParams.renderState.isPendingRefine).toBe(false);
      expect(params.refine).toHaveBeenCalled();
    });

    it('expect to listen for "idle" and do not trigger on programmatic interaction', () => {
      const mapInstance = createFakeMapInstance();
      const googleInstance = createFakeGoogleInstance({ mapInstance });
      const params = createFakeRenderOptions({
        widgetParams: createFakeWidgetParams({
          googleInstance,
        }),
      });

      renderer(params, isFirstRendering);

      // Simulate pending refine
      params.widgetParams.renderState.isPendingRefine = true;

      // Simulate programmatic event
      params.widgetParams.renderState.isUserInteraction = false;

      // Simulate center_changed event
      mapInstance.addListener.mock.calls[3][1]();

      expect(mapInstance.addListener).toHaveBeenCalledWith(
        'idle',
        expect.any(Function)
      );

      expect(params.widgetParams.renderState.isPendingRefine).toBe(true);
      expect(params.refine).not.toHaveBeenCalled();
    });

    it('expect to listen for "idle" and do not trigger when refine is not schedule', () => {
      const mapInstance = createFakeMapInstance();
      const googleInstance = createFakeGoogleInstance({ mapInstance });
      const params = createFakeRenderOptions({
        widgetParams: createFakeWidgetParams({
          googleInstance,
        }),
      });

      renderer(params, isFirstRendering);

      // Simulate center_changed event
      mapInstance.addListener.mock.calls[3][1]();

      expect(mapInstance.addListener).toHaveBeenCalledWith(
        'idle',
        expect.any(Function)
      );

      expect(params.widgetParams.renderState.isPendingRefine).toBe(false);
      expect(params.refine).not.toHaveBeenCalled();
    });

    it('expect to listen for "idle" and do not trigger when refine on map move is disabled', () => {
      const mapInstance = createFakeMapInstance();
      const googleInstance = createFakeGoogleInstance({ mapInstance });
      const params = createFakeRenderOptions({
        isRefineOnMapMove: () => false,
        widgetParams: createFakeWidgetParams({
          googleInstance,
        }),
      });

      renderer(params, isFirstRendering);

      // Simulate pending refine
      params.widgetParams.renderState.isPendingRefine = true;

      // Simulate center_changed event
      mapInstance.addListener.mock.calls[3][1]();

      expect(mapInstance.addListener).toHaveBeenCalledWith(
        'idle',
        expect.any(Function)
      );

      expect(params.widgetParams.renderState.isPendingRefine).toBe(true);
      expect(params.refine).not.toHaveBeenCalled();
    });
  });
});

describe('GeoSearchRenderer - render', () => {
  it('expect to render markers with default options', () => {
    const googleInstance = createFakeGoogleInstance();
    const renderOptions = createFakeRenderOptions({
      items: [{ objectID: 123 }, { objectID: 456 }, { objectID: 789 }],
      widgetParams: createFakeWidgetParams({
        googleInstance,
      }),
    });

    // Init
    renderer(renderOptions, true);

    // Render
    renderer(renderOptions, false);

    expect(googleInstance.maps.Marker).toHaveBeenCalledTimes(3);
    expect(googleInstance.maps.Marker.mock.calls).toEqual([
      [expect.objectContaining({ __id: 123 })],
      [expect.objectContaining({ __id: 456 })],
      [expect.objectContaining({ __id: 789 })],
    ]);
  });

  it('expect to render markers with given options', () => {
    const googleInstance = createFakeGoogleInstance();
    const renderOptions = createFakeRenderOptions({
      items: [{ objectID: 123 }, { objectID: 456 }, { objectID: 789 }],
      widgetParams: createFakeWidgetParams({
        googleInstance,
        createMarkerOptions: item => ({
          title: `ID: ${item.objectID}`,
        }),
      }),
    });

    // Init
    renderer(renderOptions, true);

    // Render
    renderer(renderOptions, false);

    expect(googleInstance.maps.Marker).toHaveBeenCalledTimes(3);
    expect(googleInstance.maps.Marker.mock.calls).toEqual([
      [expect.objectContaining({ __id: 123, title: 'ID: 123' })],
      [expect.objectContaining({ __id: 456, title: 'ID: 456' })],
      [expect.objectContaining({ __id: 789, title: 'ID: 789' })],
    ]);
  });

  it('expect to render <Control />', () => {
    const renderOptions = createFakeRenderOptions();

    renderer(renderOptions, true);
    renderer(renderOptions, false);

    expect(render.mock.calls[0]).toMatchSnapshot();
  });

  describe('initial position', () => {
    it('expect to init the position from initalPostion when no items are available & map is not yet render', () => {
      const mapInstance = createFakeMapInstance();
      const googleInstance = createFakeGoogleInstance({ mapInstance });
      const initParams = createFakeRenderOptions({
        widgetParams: createFakeWidgetParams({
          initialZoom: 8,
          initialPosition: {
            lat: 10,
            lng: 12,
          },
          googleInstance,
        }),
      });

      const renderParams = {
        ...initParams,
      };

      // Init
      renderer(initParams, true);

      // Render
      renderer(renderParams, false);

      expect(mapInstance.setCenter).toHaveBeenCalledWith({ lat: 10, lng: 12 });
      expect(mapInstance.setZoom).toHaveBeenCalledWith(8);
    });

    it('expect to init the position from position when no items are available & map is not yet render', () => {
      const mapInstance = createFakeMapInstance();
      const googleInstance = createFakeGoogleInstance({ mapInstance });
      const renderOptions = createFakeRenderOptions({
        widgetParams: createFakeWidgetParams({
          initialZoom: 8,
          position: {
            lat: 12,
            lng: 14,
          },
          initialPosition: {
            lat: 10,
            lng: 12,
          },
          googleInstance,
        }),
      });

      // Init
      renderer(renderOptions, true);

      // Render
      renderer(renderOptions, false);

      expect(mapInstance.setCenter).toHaveBeenCalledWith({ lat: 12, lng: 14 });
      expect(mapInstance.setZoom).toHaveBeenCalledWith(8);
    });

    it('expect to not init the position when items are available', () => {
      const mapInstance = createFakeMapInstance();
      const googleInstance = createFakeGoogleInstance({ mapInstance });
      const renderOptions = createFakeRenderOptions({
        items: [{ objectID: 123 }],
        widgetParams: createFakeWidgetParams({
          googleInstance,
        }),
      });

      // Init
      renderer(renderOptions, true);

      // Render
      renderer(renderOptions, false);

      expect(mapInstance.setCenter).not.toHaveBeenCalled();
      expect(mapInstance.setZoom).not.toHaveBeenCalled();
    });

    it('expect to not init the position when the map is already render', () => {
      const mapInstance = createFakeMapInstance();
      const googleInstance = createFakeGoogleInstance({ mapInstance });
      const renderOptions = createFakeRenderOptions({
        items: [{ objectID: 123 }],
        widgetParams: createFakeWidgetParams({
          googleInstance,
        }),
      });

      // Init
      renderer(renderOptions, true);

      // Render
      renderer(renderOptions, false);

      // Render without results
      renderer(
        {
          ...renderOptions,
          items: [],
        },
        false
      );

      expect(mapInstance.setCenter).not.toHaveBeenCalled();
      expect(mapInstance.setZoom).not.toHaveBeenCalled();
    });
  });

  describe('markers lifecycle', () => {
    it('expect to append all new markers on the map', () => {
      const markerInstance = createFakeMarkerInstance();
      const googleInstance = createFakeGoogleInstance({
        markerInstance,
      });

      const renderOptions = createFakeRenderOptions({
        items: [{ objectID: 123 }, { objectID: 456 }, { objectID: 789 }],
        widgetParams: createFakeWidgetParams({
          googleInstance,
        }),
      });

      // Init
      renderer(renderOptions, true);

      // Render
      renderer(renderOptions, false);

      expect(markerInstance.setMap).not.toHaveBeenCalled();
      expect(googleInstance.maps.Marker).toHaveBeenCalledTimes(3);
      expect(renderOptions.widgetParams.renderState.markers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ __id: 123 }),
          expect.objectContaining({ __id: 456 }),
          expect.objectContaining({ __id: 789 }),
        ])
      );
    });

    it('expect to append only new markers on the map on the next render', () => {
      const markerInstance = createFakeMarkerInstance();
      const googleInstance = createFakeGoogleInstance({
        markerInstance,
      });

      const renderOptions = createFakeRenderOptions({
        items: [{ objectID: 123 }, { objectID: 456 }, { objectID: 789 }],
        widgetParams: createFakeWidgetParams({
          googleInstance,
        }),
      });

      // Init
      renderer(renderOptions, true);

      // Render with inital markers
      renderer(renderOptions, false);

      googleInstance.maps.Marker.mockClear();

      // Render with inital markers
      renderer(
        {
          ...renderOptions,
          items: [
            { objectID: 123 },
            { objectID: 456 },
            { objectID: 789 },
            { objectID: 101 },
          ],
        },
        false
      );

      expect(markerInstance.setMap).not.toHaveBeenCalled();
      expect(googleInstance.maps.Marker).toHaveBeenCalledTimes(1);
      expect(renderOptions.widgetParams.renderState.markers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ __id: 123 }),
          expect.objectContaining({ __id: 456 }),
          expect.objectContaining({ __id: 789 }),
          expect.objectContaining({ __id: 101 }),
        ])
      );
    });

    it('expect to remove only old markers on the map on the next render', () => {
      const markerInstance = createFakeMarkerInstance();
      const googleInstance = createFakeGoogleInstance({
        markerInstance,
      });

      const renderOptions = createFakeRenderOptions({
        items: [{ objectID: 123 }, { objectID: 456 }, { objectID: 789 }],
        widgetParams: createFakeWidgetParams({
          googleInstance,
        }),
      });

      // Init
      renderer(renderOptions, true);

      // Render with inital markers
      renderer(renderOptions, false);

      googleInstance.maps.Marker.mockClear();

      // Render with inital markers
      renderer(
        {
          ...renderOptions,
          items: [{ objectID: 123 }],
        },
        false
      );

      expect(googleInstance.maps.Marker).not.toHaveBeenCalled();
      expect(markerInstance.setMap).toHaveBeenCalledTimes(2);
      expect(renderOptions.widgetParams.renderState.markers).toEqual(
        expect.arrayContaining([expect.objectContaining({ __id: 123 })])
      );
    });
  });

  describe('fit markers position', () => {
    it('expect to set the position from makers', () => {
      const mapInstance = createFakeMapInstance();
      const googleInstance = createFakeGoogleInstance({ mapInstance });
      const renderOptions = createFakeRenderOptions({
        items: [{ objectID: 123 }],
        widgetParams: createFakeWidgetParams({
          googleInstance,
        }),
      });

      // Init
      renderer(renderOptions, true);

      // Render
      renderer(renderOptions, false);

      // Render
      renderer(
        {
          ...renderOptions,
          items: [{ objectID: 123 }, { objectID: 456 }],
        },
        false
      );

      expect(mapInstance.fitBounds).toHaveBeenCalledTimes(2);
    });

    it('expect to not set the position from makers when there is no markers', () => {
      const mapInstance = createFakeMapInstance();
      const googleInstance = createFakeGoogleInstance({ mapInstance });
      const renderOptions = createFakeRenderOptions({
        items: [],
        widgetParams: createFakeWidgetParams({
          googleInstance,
        }),
      });

      // Init
      renderer(renderOptions, true);

      // Render
      renderer(renderOptions, false);

      // Render
      renderer(renderOptions, false);

      expect(mapInstance.fitBounds).not.toHaveBeenCalled();
    });

    it('expect to not set the position from makers when the map has move since last refine', () => {
      const mapInstance = createFakeMapInstance();
      const googleInstance = createFakeGoogleInstance({ mapInstance });
      const renderOptions = createFakeRenderOptions({
        items: [{ objectID: 123 }],
        widgetParams: createFakeWidgetParams({
          googleInstance,
        }),
      });

      // Init
      renderer(renderOptions, true);

      renderOptions.hasMapMoveSinceLastRefine.mockImplementation(() => true);

      // Render when map has move
      renderer(renderOptions, false);

      renderOptions.hasMapMoveSinceLastRefine.mockImplementation(() => false);

      // Render when map hasn't move
      renderer(renderOptions, false);

      expect(mapInstance.fitBounds).toHaveBeenCalledTimes(1);
    });

    it('expect to not set the position from makers when the refinement is coming from the map', () => {
      const mapInstance = createFakeMapInstance();
      const googleInstance = createFakeGoogleInstance({ mapInstance });
      const renderOptions = createFakeRenderOptions({
        items: [{ objectID: 123 }],
        widgetParams: createFakeWidgetParams({
          googleInstance,
        }),
      });

      // Init
      renderer(renderOptions, true);

      renderOptions.isRefinedWithMap.mockImplementation(() => true);

      // Render when the refinement is coming from the map
      renderer(renderOptions, false);

      renderOptions.isRefinedWithMap.mockImplementation(() => false);

      // Render when the refinement is not coming from the map
      renderer(renderOptions, false);

      expect(mapInstance.fitBounds).toHaveBeenCalledTimes(1);
    });
  });
});
