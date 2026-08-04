import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { type SimpleTicketInfo } from '@keebmeet/shared';
import type { FeatureCollection, Point } from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTheme } from 'next-themes';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { FiMap } from 'react-icons/fi';
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
import { useLocation } from 'react-router-dom';
import { MeetupModal } from '../components/Meetups/MeetupModal';
import { MeetupSearchInput } from '../components/Meetups/MeetupSearchInput';
import { MeetupTagFilter } from '../components/Meetups/MeetupTagFilter';
import config from '../config';
import { useHoldExpiryRefetch } from '../hooks/useHoldExpiryRefetch';
import {
  useMeetupCoordinates,
  type MeetupPoint,
} from '../hooks/useMeetupCoordinates';
import { useMeetupSearch } from '../hooks/useMeetupSearch';
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
    'heatmap-weight': ['get', 'count'],
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

interface VenueMeetup {
  slug: string;
  name: string;
}

interface ActiveVenue {
  longitude: number;
  latitude: number;
  city: string;
  meetups: VenueMeetup[];
}

const venueKey = (venue: { longitude: number; latitude: number }): string =>
  `${String(venue.longitude)},${String(venue.latitude)}`;

const toActiveVenue = (event: MapMouseEvent): ActiveVenue | null => {
  const feature = event.features?.[0];
  if (feature == null) return null;
  const [longitude, latitude] = (feature.geometry as Point).coordinates;
  // Mapbox serializes nested feature properties to JSON strings.
  const props = feature.properties as { city: string; meetups: string };
  return {
    longitude,
    latitude,
    city: props.city,
    meetups: JSON.parse(props.meetups) as VenueMeetup[],
  };
};

// Grouped by address, not coordinates: unresolvable addresses all geocode to
// the same city centroid but are different venues.
const toFeatureCollection = (points: MeetupPoint[]): FeatureCollection => {
  // Plain object: react-map-gl's Map import shadows the built-in.
  const venues: Record<string, ActiveVenue> = {};
  for (const point of points) {
    venues[point.address] ??= {
      longitude: point.longitude,
      latitude: point.latitude,
      city: point.meetup.location.city,
      meetups: [],
    };
    venues[point.address].meetups.push({
      slug: point.meetup.slug,
      name: point.meetup.name,
    });
  }

  // Fan out venues that still collide so each pin stays hoverable.
  const coordCounts: Record<string, number> = {};
  for (const venue of Object.values(venues)) {
    const key = venueKey(venue);
    const n = coordCounts[key] ?? 0;
    coordCounts[key] = n + 1;
    if (n > 0) {
      const angle = (n * 2 * Math.PI) / 6;
      venue.longitude += 0.004 * Math.cos(angle);
      venue.latitude += 0.004 * Math.sin(angle);
    }
  }

  return {
    type: 'FeatureCollection',
    features: Object.values(venues).map((venue) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [venue.longitude, venue.latitude],
      },
      properties: {
        city: venue.city,
        meetups: venue.meetups,
        count: venue.meetups.length,
      },
    })),
  };
};

const MapPage = (): ReactNode => {
  const [mode, setMode] = useState<'heatmap' | 'points'>('points');
  const [hovered, setHovered] = useState<ActiveVenue | null>(null);
  const [pinned, setPinned] = useState<ActiveVenue | null>(null);
  const [cursor, setCursor] = useState('grab');
  const [mapReady, setMapReady] = useState(false);

  const [selectedSlug, setSelectedSlug] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const {
    searchInput,
    setSearchInput,
    searchExpanded,
    setSearchExpanded,
    debouncedSearch,
    byName,
  } = useMeetupSearch();

  const mapRef = useRef<MapRef>(null);
  const { resolvedTheme } = useTheme();
  const { isLoggedIn, user } = useAppSelector((state) => state.user);

  const location = useLocation();
  const focusSlug = (location.state as { focusSlug?: string } | null)
    ?.focusSlug;
  const focusHandledKey = useRef('');

  const { data: meetups } = useGetMeetupsQuery({
    by_tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    by_name: byName,
  });

  // Filtering can remove the venue a popup points at.
  const clearPopups = (): void => {
    setHovered(null);
    setPinned(null);
  };

  const toggleTag = (tagId: string): void => {
    clearPopups();
    setSelectedTagIds((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId]
    );
  };
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
    const map = mapRef.current;
    if (!mapReady || map == null || points.length === 0) return;

    if (focusSlug != null && focusHandledKey.current !== location.key) {
      focusHandledKey.current = location.key;
      const feature = geojson.features.find((candidate) =>
        (candidate.properties as { meetups: VenueMeetup[] }).meetups.some(
          (meetup) => meetup.slug === focusSlug
        )
      );
      if (feature != null) {
        const [longitude, latitude] = (feature.geometry as Point).coordinates;
        map.flyTo({ center: [longitude, latitude], zoom: 11, speed: 2.5 });
        const props = feature.properties as {
          city: string;
          meetups: VenueMeetup[];
        };
        requestAnimationFrame(() => {
          setPinned({
            longitude,
            latitude,
            city: props.city,
            meetups: props.meetups,
          });
        });
        return;
      }
    }

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
  }, [mapReady, points, geojson, focusSlug, location.key]);

  const mapStyle =
    resolvedTheme === 'dark'
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11';

  const handleMouseMove = (event: MapMouseEvent): void => {
    if (!canHover) return;
    const info = toActiveVenue(event);
    setCursor(info != null ? 'pointer' : 'grab');
    setHovered((current) =>
      info == null
        ? null
        : current != null && venueKey(current) === venueKey(info)
          ? current
          : info
    );
  };

  const handleClick = (event: MapMouseEvent): void => {
    const info = toActiveVenue(event);
    // Multi-meetup venues pin instead: hover popups ignore the pointer, so
    // pinning is what makes the list clickable.
    if (canHover && info != null && info.meetups.length === 1) {
      setSelectedSlug(info.meetups[0].slug);
      return;
    }
    setPinned(info);
  };

  const shown = hovered ?? pinned;
  const isPinned =
    pinned != null && shown != null && venueKey(shown) === venueKey(pinned);

  const missingToken = config.mapboxToken === '';

  return (
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
            onStyleData={() => {
              setMapReady(true);
            }}
            onLoad={() => {
              setMapReady(true);
            }}
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
                key={`${venueKey(shown)}-${String(isPinned)}`}
                className={
                  isPinned ? 'meetup-popup' : 'meetup-popup meetup-popup-hover'
                }
                longitude={shown.longitude}
                latitude={shown.latitude}
                anchor="bottom"
                offset={12}
                focusAfterOpen={false}
                onClose={() => {
                  setPinned(null);
                }}
                closeButton={false}
                closeOnClick={false}
              >
                <div className="flex flex-col gap-0.5">
                  {shown.meetups.map((meetup) => (
                    <button
                      key={meetup.slug}
                      className="text-left"
                      onClick={() => {
                        setSelectedSlug(meetup.slug);
                      }}
                    >
                      <span className="text-foreground text-sm font-semibold hover:underline">
                        {meetup.name}
                      </span>
                    </button>
                  ))}
                  <span className="text-muted-foreground text-xs">
                    {shown.city}
                  </span>
                </div>
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

          <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
            <div className="bg-card flex items-center gap-1 rounded-lg border p-1 shadow-md">
              <MeetupSearchInput
                value={searchInput}
                onChange={(value) => {
                  clearPopups();
                  setSearchInput(value);
                }}
                expanded={searchExpanded}
                onExpandedChange={setSearchExpanded}
                expandInline
              />
              <MeetupTagFilter
                selectedTagIds={selectedTagIds}
                onToggle={toggleTag}
                onClear={() => {
                  clearPopups();
                  setSelectedTagIds([]);
                }}
              />
            </div>
            {isLoading ? (
              <div className="bg-card text-muted-foreground flex items-center gap-2 rounded-lg border px-3 py-2 text-xs shadow-md">
                <Spinner className="size-4" />
                Locating meetups…
              </div>
            ) : null}
            {!isLoading &&
            points.length === 0 &&
            (debouncedSearch !== '' || selectedTagIds.length > 0) ? (
              <div className="bg-card text-muted-foreground rounded-lg border px-3 py-2 text-xs shadow-md">
                No meetups match your search.
              </div>
            ) : null}
          </div>
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
  );
};

export default MapPage;
