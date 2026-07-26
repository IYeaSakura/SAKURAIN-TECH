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
  const [data, setData] = useState<CityData | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [isOpen, setIsOpen] = useState(false);

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
      wrapper.className = 'relative flex flex-col items-center';
      wrapper.style.cssText = 'pointer-events: auto; transform: translate(-50%, -100%);';

      const pin = document.createElement('div');
      pin.className = `flex items-center justify-center border-2 shadow-md ${isCurrent ? 'w-6 h-6' : 'w-4 h-4'}`;
      pin.style.cssText = `
        background: ${isCurrent ? 'var(--accent-secondary)' : 'var(--accent-primary)'};
        border-color: var(--bg-primary);
        box-shadow: 2px 2px 0 var(--border-subtle);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
      `;

      const label = document.createElement('div');
      label.className = 'absolute -top-5 px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase whitespace-nowrap border-2';
      label.style.cssText = `
        background: var(--bg-secondary);
        color: var(--text-primary);
        border-color: var(--border-subtle);
        box-shadow: 2px 2px 0 var(--border-subtle);
      `;
      label.textContent = city.name;

      wrapper.appendChild(pin);
      wrapper.appendChild(label);
      return wrapper;
    },
    []
  );

  const buildMap = useCallback(
    async (container: HTMLDivElement, zoom: number, draggable: boolean) => {
      if (typeof window !== 'undefined') {
        window._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_CODE };
      }

      const AMap = await AMapLoader.load({ key: AMAP_KEY, version: '2.0' });

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

        if (isCurrent) {
          const pulse = document.createElement('div');
          pulse.className = 'absolute rounded-full';
          pulse.style.cssText = `
            width: 48px;
            height: 48px;
            background: var(--accent-secondary);
            opacity: 0.25;
            animation: amap-pulse 2s ease-out infinite;
            transform: translate(-50%, -50%);
          `;
          const pulseMarker = new AMap.Marker({
            position: city.coordinates,
            content: pulse,
            offset: new AMap.Pixel(0, 0),
            zIndex: 10,
          });
          map.add(pulseMarker);
        }
      });

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
              className="absolute bottom-3 left-3 px-3 py-2 border-2 text-[10px] font-mono uppercase z-[1] pointer-events-none"
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
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent-primary)' }} />
                {t.home.travelMapVisitedLabel}
              </div>
            </div>
          )}

          {status === 'ready' && (
            <div
              className="absolute bottom-3 right-3 px-3 py-1.5 border-2 text-[10px] font-mono uppercase opacity-0 group-hover:opacity-100 transition-opacity z-[1]"
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
