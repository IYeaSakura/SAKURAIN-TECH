'use client';

/**
 * AMapWidget —— homepage travel map powered by AMap.
 *
 * A compact preview map is shown on the dashboard; clicking it opens a
 * large modal map with the same markers and route line. Cities are
 * connected in visit order and the current city pulses for emphasis.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, X, Maximize2 } from 'lucide-react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { useTranslation, useAnimationEnabled, useTheme } from '@/hooks';

const AMAP_KEY = '39ac49fa38093f93930cffeb5d489242';
const AMAP_SECURITY_CODE = 'a84a319cb62ac0a1dc9813d756fcd7ec';

interface City {
  name: string;
  coordinates: [number, number];
}

interface CityData {
  current: City;
  visited: City[];
}

export function AMapWidget() {
  const { t, locale } = useTranslation();
  const animationEnabled = useAnimationEnabled();
  const { theme } = useTheme();
  const previewRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previewMapRef = useRef<unknown | null>(null);
  const modalMapRef = useRef<unknown | null>(null);
  const amapRef = useRef<unknown | null>(null);
  const clientLocationRef = useRef<{ city: string; coordinates: [number, number] } | null>(null);
  const [data, setData] = useState<CityData | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [isOpen, setIsOpen] = useState(false);
  const [clientLocation, setClientLocation] = useState<{ city: string; coordinates: [number, number] } | null>(null);

  // Load city configuration.
  useEffect(() => {
    fetch('/data/cities.json')
      .then((res) => res.json())
      .then((json: CityData) => setData(json))
      .catch((error) => {
        console.error('Failed to load city data:', error);
        setStatus('error');
      });
  }, []);

  const mapStyle = theme === 'light' ? 'amap://styles/normal' : 'amap://styles/dark';

  const createMarkerContent = useCallback(
    (city: City, isCurrent: boolean) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'relative flex items-center justify-center';
      wrapper.style.cssText = 'pointer-events: auto; transform: translate(-50%, -50%);';

      const color = isCurrent ? 'var(--accent-secondary)' : 'var(--accent-primary)';

      if (isCurrent) {
        const ring = document.createElement('div');
        ring.className = 'absolute rounded-full';
        ring.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          width: 28px;
          height: 28px;
          border: 2px solid ${color};
          opacity: 0.5;
          animation: amap-pulse 2s ease-out infinite;
        `;
        wrapper.appendChild(ring);
      }

      const core = document.createElement('div');
      core.className = `rounded-full border-2 ${isCurrent ? 'w-3 h-3' : 'w-2 h-2'}`;
      core.style.cssText = `
        background: ${color};
        border-color: var(--bg-primary);
        box-shadow: 0 0 ${isCurrent ? '12px' : '6px'} ${color};
      `;

      wrapper.appendChild(core);
      return wrapper;
    },
    []
  );

  const createClientMarkerContent = useCallback(() => {
    const wrapper = document.createElement('div');
    wrapper.className = 'relative flex items-center justify-center';
    wrapper.style.cssText = 'pointer-events: auto; transform: translate(-50%, -50%);';

    const color = 'var(--accent-tertiary)';

    const ring = document.createElement('div');
    ring.className = 'absolute rounded-full';
    ring.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 24px;
      height: 24px;
      border: 2px solid ${color};
      opacity: 0.5;
      animation: amap-pulse 2s ease-out infinite;
    `;

    const core = document.createElement('div');
    core.className = 'w-2.5 h-2.5 rounded-full border-2';
    core.style.cssText = `
      background: ${color};
      border-color: var(--bg-primary);
      box-shadow: 0 0 10px ${color};
    `;

    wrapper.appendChild(ring);
    wrapper.appendChild(core);
    return wrapper;
  }, []);

  const addClientMarker = useCallback(
    (map: unknown, location: { coordinates: [number, number] }) => {
      if (!map || !amapRef.current) return;

      const AMap = amapRef.current as {
        Marker: new (opts: Record<string, unknown>) => unknown;
        Pixel: new (x: number, y: number) => unknown;
      };

      const mapInstance = map as {
        add: (marker: unknown) => void;
        remove: (marker: unknown) => void;
        __clientMarker?: unknown;
      };

      if (mapInstance.__clientMarker) {
        mapInstance.remove(mapInstance.__clientMarker);
      }

      const marker = new AMap.Marker({
        position: location.coordinates,
        content: createClientMarkerContent(),
        offset: new AMap.Pixel(0, 0),
        zIndex: 40,
        title: `You: ${clientLocation?.city || ''}`,
      });

      mapInstance.add(marker);
      mapInstance.__clientMarker = marker;
    },
    [createClientMarkerContent, clientLocation]
  );

  const buildMap = useCallback(
    async (container: HTMLDivElement, zoom: number, draggable: boolean) => {
      if (typeof window !== 'undefined') {
        window._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_CODE };
      }

      const AMap = await AMapLoader.load({ key: AMAP_KEY, version: '2.0' });
      amapRef.current = AMap;

      const map = new AMap.Map(container, {
        zoom,
        center: data?.current.coordinates,
        viewMode: '2D',
        mapStyle,
        dragEnable: draggable,
        scrollWheel: draggable,
        doubleClickZoom: draggable,
        keyboardEnable: draggable,
      });

      if (!data) return map;

      const uniqueCities = Array.from(
        new Map([...data.visited, data.current].map((c) => [c.name, c])).values()
      );

      // Route line connecting visited cities in order.
      const routePath = data.visited.map((c) => c.coordinates);
      if (routePath.length > 1) {
        const polyline = new AMap.Polyline({
          path: routePath,
          strokeColor: 'var(--accent-primary)',
          strokeWeight: 2,
          strokeStyle: 'dashed',
          strokeDash: [6, 4],
          lineJoin: 'round',
        });
        map.add(polyline);
      }

      uniqueCities.forEach((city) => {
        const isCurrent = city.name === data.current.name;
        const marker = new AMap.Marker({
          position: city.coordinates,
          content: createMarkerContent(city, isCurrent),
          offset: new AMap.Pixel(0, 0),
          zIndex: isCurrent ? 30 : 20,
          title: city.name,
        });
        map.add(marker);
      });

      if (clientLocationRef.current) {
        addClientMarker(map, clientLocationRef.current);
      }

      return map;
    },
    [data, mapStyle, createMarkerContent]
  );

  // Preview map.
  useEffect(() => {
    if (!previewRef.current || !data || previewMapRef.current) return;

    let cancelled = false;
    buildMap(previewRef.current, 5, false)
      .then((map) => {
        if (!cancelled) {
          previewMapRef.current = map;
          setStatus('ready');
        }
      })
      .catch((error) => {
        console.error('Preview map failed:', error);
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [data, buildMap]);

  // Modal map.
  useEffect(() => {
    if (!isOpen || !modalRef.current || !data || modalMapRef.current) return;

    let cancelled = false;
    buildMap(modalRef.current, 6, true)
      .then((map) => {
        if (!cancelled) modalMapRef.current = map;
      })
      .catch((error) => {
        console.error('Modal map failed:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, data, buildMap]);

  // Detect client location and reverse geocode to city name.
  useEffect(() => {
    if (!navigator.geolocation) return;

    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;

        AMapLoader.load({ key: AMAP_KEY, version: '2.0' })
          .then((AMap) => {
            if (cancelled) return;
            amapRef.current = AMap;

            (AMap as { convertFrom: (path: unknown, type: string, cb: (status: string, result: { locations?: Array<{ lng: number; lat: number }> }) => void) => void }).convertFrom(
              [longitude, latitude],
              'gps',
              (status, result) => {
                if (status !== 'complete' || !result.locations?.[0]) return;
                const lnglat = result.locations[0];

                (AMap as { plugin: (name: string, cb: () => void) => void }).plugin('AMap.Geocoder', () => {
                  const geocoder = new (AMap as { Geocoder: new () => { getAddress: (lnglat: unknown, cb: (status: string, result?: { regeocode?: { addressComponent?: { city?: string; district?: string; province?: string } } }) => void) => void } }).Geocoder();

                  geocoder.getAddress(lnglat, (geoStatus, geoResult) => {
                    if (geoStatus !== 'complete' || !geoResult?.regeocode?.addressComponent) return;
                    const component = geoResult.regeocode.addressComponent;
                    const city = component.city || component.district || component.province || 'Unknown';
                    setClientLocation({ city, coordinates: [lnglat.lng, lnglat.lat] });
                  });
                });
              }
            );
          })
          .catch((error) => {
            console.error('Failed to load AMap for geolocation:', error);
          });
      },
      (error) => {
        console.warn('Client geolocation unavailable:', error.message);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  // Sync client location marker to both maps when location is resolved.
  useEffect(() => {
    if (!clientLocation) return;

    clientLocationRef.current = clientLocation;

    if (previewMapRef.current) {
      addClientMarker(previewMapRef.current, clientLocation);
    }
    if (modalMapRef.current) {
      addClientMarker(modalMapRef.current, clientLocation);
    }
  }, [clientLocation, addClientMarker]);

  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (modalMapRef.current && typeof (modalMapRef.current as { destroy?: () => void }).destroy === 'function') {
      (modalMapRef.current as { destroy: () => void }).destroy();
    }
    modalMapRef.current = null;
  }, []);

  const retry = useCallback(() => {
    setStatus('loading');
    fetch('/data/cities.json')
      .then((res) => res.json())
      .then((json: CityData) => setData(json))
      .catch(() => setStatus('error'));
  }, []);

  if (!data) return null;

  return (
    <>
      <motion.div
        initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="h-full min-h-[360px] sm:min-h-[420px] border-2 flex flex-col overflow-hidden group cursor-pointer"
        onClick={handleOpen}
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-subtle)',
          boxShadow: '4px 4px 0 var(--border-subtle)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b-2" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
            <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {t.home.travelMap}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase" style={{ color: 'var(--text-muted)' }}>
              {t.home.travelMapVisited.replace('{count}', String(data.visited.length))}
            </span>
            <Maximize2 className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>

        <div className="relative flex-1 min-h-0">
          <div ref={previewRef} className="absolute inset-0" />

          {status !== 'ready' && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              {status === 'loading' ? (
                <>
                  <div
                    className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-3"
                    style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
                  />
                  <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                    {t.common.loading}
                  </span>
                </>
              ) : (
                <>
                  <MapPin className="w-8 h-8 mb-3" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-xs font-mono mb-3" style={{ color: 'var(--text-muted)' }}>
                    {t.common.error}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      retry();
                    }}
                    className="px-3 py-1 text-[10px] font-mono uppercase border-2"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  >
                    {t.common.retry}
                  </button>
                </>
              )}
            </div>
          )}

          {status === 'ready' && (
            <div
              className="absolute bottom-3 right-3 px-3 py-2 border-2 text-[10px] font-mono uppercase z-[1] pointer-events-none"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent-secondary)' }} />
                {t.home.travelMapCurrent.replace('{city}', data.current.name)}
              </div>
              <div className={`flex items-center gap-2 ${clientLocation ? 'mb-1' : ''}`}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent-primary)' }} />
                {t.home.travelMapVisitedLabel}
              </div>
              {clientLocation && (
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent-tertiary)' }} />
                  {t.home.travelMapClient.replace('{city}', clientLocation.city)}
                </div>
              )}
            </div>
          )}

          {status === 'ready' && (
            <div
              className="absolute bottom-3 left-3 px-3 py-1.5 border-2 text-[10px] font-mono uppercase opacity-0 group-hover:opacity-100 transition-opacity z-[1]"
              style={{
                background: 'var(--accent-primary)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--bg-primary)',
              }}
            >
              {locale === 'zh' ? '点击查看完整地图' : 'Click to expand'}
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.8)' }}
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-5xl h-[70vh] sm:h-[80vh] border-2 flex flex-col overflow-hidden"
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--border-subtle)',
                boxShadow: '8px 8px 0 var(--border-subtle)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex items-center justify-between px-4 py-3 border-b-2"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
                  <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {t.home.travelMap}
                  </span>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 border-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                  aria-label={t.common.close}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative flex-1 min-h-0">
                <div ref={modalRef} className="absolute inset-0" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes amap-pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0.5;
          }
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
