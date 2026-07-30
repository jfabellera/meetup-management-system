import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { FeatureCollection, Point } from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTheme } from 'next-themes';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { FiMap } from 'react-icons/fi';
import { type SimpleTicketInfo } from '@keebmeet/shared';
import {
  Layer,
  Map,
  NavigationControl,
  Popup,
  Source,
  type LayerProps,
  type MapMouseEvent,
  type MapRef,
} from 'react-map-gl/mapbox';
import { MeetupModal } from '../components/Meetups/MeetupModal';
import Page from '../components/Page/Page';
import { mainSidebarItems } from '../components/Sidebar/navItems';
import config from '../config';
import { useHoldExpiryRefetch } from '../hooks/useHoldExpiryRefetch';
import {
  useMeetupCoordinates,
  type MeetupPoint,
} from '../hooks/useMeetupCoordinates';
import { useAppSelector } from '../store/hooks';
import { useGetMeetupsQuery } from '../store/meetupSlice';
import { useGetTicketsQuery } from '../store/ticketSlice';
import { readGuestHold } from '../util/guestHold';

const POINTS_LAYER_ID = 'meetup-points';

const canHover = window.matchMedia('(hover: hover)').matches;

const heatmapLayer: LayerProps = {
  id: 'meetup-heatmap',
  type: 'heatmap',
  paint: {
    'heatmap-weight': 1,
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0,
      'rgba(198, 93, 59, 0)',
      0.2,
      'rgba(198, 93, 59, 0.35)',
      0.5,
      'rgba(210, 110, 70, 0.6)',
      0.8,
      'rgba(230, 150, 90, 0.8)',
      1,
      'rgba(245, 200, 130, 0.95)',
    ],
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 12, 9, 40],
    'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 12, 0.6],
  },
};

const pointsLayer: LayerProps = {
  id: POINTS_LAYER_ID,
  type: 'circle',
  paint: {
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 5, 10, 9],
    'circle-color': '#c65d3b',
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff',
    'circle-opacity': 0.9,
  },
};

interface ActiveMeetup {
  longitude: number;
  latitude: number;
  slug: string;
  name: string;
  city: string;
}

const toActiveMeetup = (event: MapMouseEvent): ActiveMeetup | null => {
  const feature = event.features?.[0];
  if (feature == null) return null;
  const [longitude, latitude] = (feature.geometry as Point).coordinates;
  const props = feature.properties as {
    slug: string;
    name: string;
    city: string;
  };
  return { longitude, latitude, ...props };
};

const toFeatureCollection = (points: MeetupPoint[]): FeatureCollection => ({
  type: 'FeatureCollection',
  features: points.map((point) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [point.longitude, point.latitude],
    },
    properties: {
      id: point.meetup.id,
      slug: point.meetup.slug,
      name: point.meetup.name,
      city: point.meetup.location.city,
    },
  })),
});

const MapPage = (): ReactNode => {
  const [sidebarValue, setSidebarValue] = useState('map');
  const [mode, setMode] = useState<'heatmap' | 'points'>('points');
  const [hovered, setHovered] = useState<ActiveMeetup | null>(null);
  const [pinned, setPinned] = useState<ActiveMeetup | null>(null);
  const [cursor, setCursor] = useState('grab');

  const [selectedSlug, setSelectedSlug] = useState('');

  const mapRef = useRef<MapRef>(null);
  const { resolvedTheme } = useTheme();
  const { isLoggedIn, user } = useAppSelector((state) => state.user);

  const { data: meetups } = useGetMeetupsQuery({});
  const { points, isLoading } = useMeetupCoordinates(meetups);

  const selectedMeetupId =
    meetups?.find((meetup) => meetup.slug === selectedSlug)?.id ?? '';
  const { data: tickets } = useGetTicketsQuery(user != null ? user.id : '', {
    skip: user == null,
  });
  useHoldExpiryRefetch(tickets);

  // Same lookup as the homepage: the user's ticket, or a guest's pending hold.
  const getTicketForMeetup = (meetupId: string): SimpleTicketInfo | null => {
    if (user != null) {
      if (tickets == null) return null;
      const ticket = tickets.filter(
        (ticket) => ticket.meetup_id === meetupId
      )[0];
      return ticket ?? null;
    }
    const hold = readGuestHold(meetupId);
    return hold != null
      ? {
          id: hold.ticketId,
          meetup_id: meetupId,
          payment_status: 'pending',
          hold_expires_at: hold.holdExpiresAt,
        }
      : null;
  };

  const geojson = useMemo(() => toFeatureCollection(points), [points]);

  useEffect(() => {
    if (points.length === 0 || mapRef.current == null) return;

    const map = mapRef.current;
    const first = points[0];
    let minLng = first.longitude;
    let maxLng = first.longitude;
    let minLat = first.latitude;
    let maxLat = first.latitude;
    for (const point of points) {
      minLng = Math.min(minLng, point.longitude);
      maxLng = Math.max(maxLng, point.longitude);
      minLat = Math.min(minLat, point.latitude);
      maxLat = Math.max(maxLat, point.latitude);
    }
    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: 80, maxZoom: 10, duration: 0 }
    );
  }, [points]);

  const mapStyle =
    resolvedTheme === 'dark'
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11';

  const handleMouseMove = (event: MapMouseEvent): void => {
    if (!canHover) return;
    const info = toActiveMeetup(event);
    setCursor(info != null ? 'pointer' : 'grab');
    setHovered((current) =>
      info == null ? null : current?.slug === info.slug ? current : info
    );
  };

  const handleClick = (event: MapMouseEvent): void => {
    const info = toActiveMeetup(event);
    if (canHover) {
      if (info != null) setSelectedSlug(info.slug);
    } else {
      setPinned(info);
    }
  };

  const shown = hovered ?? pinned;
  const isPinned = pinned != null && shown?.slug === pinned.slug;

  const missingToken = config.mapboxToken === '';

  return (
    <Page
      sidebarItems={mainSidebarItems}
      sidebarValue={sidebarValue}
      setSidebarValue={setSidebarValue}
      mobileMenu
    >
      <div className="relative h-full w-full">
        {missingToken ? (
          <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center">
            <FiMap className="size-8" />
            <p className="text-sm">
              Set <code className="font-mono">VITE_MAPBOX_TOKEN</code> to enable
              the map.
            </p>
          </div>
        ) : (
          <>
            <Map
              ref={mapRef}
              mapboxAccessToken={config.mapboxToken}
              initialViewState={{ longitude: -98, latitude: 39, zoom: 3 }}
              mapStyle={mapStyle}
              interactiveLayerIds={mode === 'points' ? [POINTS_LAYER_ID] : []}
              cursor={cursor}
              onClick={handleClick}
              onMouseMove={handleMouseMove}
              onMouseOut={() => {
                setHovered(null);
                setCursor('grab');
              }}
              style={{ width: '100%', height: '100%' }}
            >
              <NavigationControl position="bottom-right" />
              <Source id="meetups" type="geojson" data={geojson}>
                <Layer
                  {...heatmapLayer}
                  layout={{
                    visibility: mode === 'heatmap' ? 'visible' : 'none',
                  }}
                />
                <Layer
                  {...pointsLayer}
                  layout={{
                    visibility: mode === 'points' ? 'visible' : 'none',
                  }}
                />
              </Source>

              {shown != null && mode === 'points' ? (
                <Popup
                  // Remount on pin-state changes so the className swap sticks.
                  key={`${shown.slug}-${String(isPinned)}`}
                  className={
                    isPinned
                      ? 'meetup-popup'
                      : 'meetup-popup meetup-popup-hover'
                  }
                  longitude={shown.longitude}
                  latitude={shown.latitude}
                  anchor="bottom"
                  offset={12}
                  onClose={() => {
                    setPinned(null);
                  }}
                  closeButton={false}
                  closeOnClick={false}
                >
                  <button
                    className="flex flex-col gap-0.5 text-left"
                    onClick={() => {
                      setSelectedSlug(shown.slug);
                    }}
                  >
                    <span className="text-foreground text-sm font-semibold hover:underline">
                      {shown.name}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {shown.city}
                    </span>
                  </button>
                </Popup>
              ) : null}
            </Map>

            <div className="bg-card absolute top-4 left-4 z-10 flex gap-1 rounded-lg border p-1 shadow-md">
              <Button
                size="sm"
                variant={mode === 'points' ? 'default' : 'ghost'}
                onClick={() => {
                  setMode('points');
                }}
              >
                Points
              </Button>
              <Button
                size="sm"
                variant={mode === 'heatmap' ? 'default' : 'ghost'}
                onClick={() => {
                  setHovered(null);
                  setPinned(null);
                  setCursor('grab');
                  setMode('heatmap');
                }}
              >
                Heatmap
              </Button>
            </div>

            {isLoading ? (
              <div className="bg-card text-muted-foreground absolute top-4 right-4 z-10 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs shadow-md">
                <Spinner className="size-4" />
                Locating meetups…
              </div>
            ) : null}
          </>
        )}
        <MeetupModal
          meetupId={selectedSlug}
          ticket={getTicketForMeetup(selectedMeetupId)}
          isLoggedIn={isLoggedIn}
          isOpen={selectedSlug !== ''}
          isRsvp={false}
          onClose={() => {
            setSelectedSlug('');
          }}
        />
      </div>
    </Page>
  );
};

export default MapPage;
