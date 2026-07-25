'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, AlertCircle, Orbit, Eye, EyeOff, Satellite, Type, Globe, FileText, Maximize2, Clock } from 'lucide-react';
import * as Cesium from 'cesium';
import ReactMarkdown from 'react-markdown';
import { generateAuthHeaders } from '@/lib/api-auth';
import { useTranslation } from '@/hooks';

// API base path (same-origin relative path; configure API_BASE_URL for cross-origin deployments)
const API_BASE_URL = `${process.env.API_BASE_URL || ''}/api/danmaku`;

// Debug logging (development only to avoid noise in production)
const debugLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'development') return;
  console.log('[Danmaku]', ...args);
};

// Rate limiting configuration
const RATE_LIMIT = {
  minInterval: 5000,
  maxPerMinute: 10,
  maxPerHour: 50,
};

// Earth and orbit constants
const EARTH_RADIUS = 6371000; // Earth radius in meters

// Orbit altitude ranges in meters - real orbital definitions
const ORBIT_RANGES = {
  // Low Earth Orbit: 200-2000km
  low: { min: 200000, max: 2000000, label: 'LEO', desc: '200-2000km' },
  // Medium Earth Orbit: 2000-35786km
  medium: { min: 2000000, max: 35786000, label: 'MEO', desc: '2000-35786km' },
  // Geostationary Orbit: ~35786km
  high: { min: 35786000, max: 60000000, label: 'GEO', desc: '~35786km' },
};

type OrbitType = 'low' | 'medium' | 'high';

interface Danmaku {
  id: string;
  text: string;
  userId: string;
  timestamp: number;
  angle: number;
  speed: number;
  color: string;
  inclination: number;
  altitude: number;
  orbitType: OrbitType;
  raan?: number; // Right Ascension of Ascending Node, used to determine the orbital plane
  markdown?: string; // Markdown content, empty by default
}

interface DanmakuSatelliteProps {
  viewer: Cesium.Viewer | null;
  setIsRotationPaused: (paused: boolean) => void;
}

class RateLimiter {
  private records: number[] = [];
  private lastSendTime: number = 0;

  canSend(): { allowed: boolean; waitTime?: number; reason?: 'tooFast' | 'tooMany' } {
    const now = Date.now();
    const timeSinceLastSend = now - this.lastSendTime;
    if (timeSinceLastSend < RATE_LIMIT.minInterval) {
      return {
        allowed: false,
        waitTime: RATE_LIMIT.minInterval - timeSinceLastSend,
        reason: 'tooFast',
      };
    }
    this.records = this.records.filter(time => now - time < 3600000);
    const recentRecords = this.records.filter(time => now - time < 60000);
    if (recentRecords.length >= RATE_LIMIT.maxPerMinute) {
      return { allowed: false, reason: 'tooMany' };
    }
    return { allowed: true };
  }

  recordSend(): void {
    this.lastSendTime = Date.now();
    this.records.push(this.lastSendTime);
  }

  getRemainingQuota(): { perMinute: number; perHour: number } {
    const now = Date.now();
    this.records = this.records.filter(time => now - time < 3600000);
    const recentRecords = this.records.filter(time => now - time < 60000);
    return {
      perMinute: RATE_LIMIT.maxPerMinute - recentRecords.length,
      perHour: RATE_LIMIT.maxPerHour - this.records.length,
    };
  }
}

const USER_ID_KEY = 'danmaku-user-id';

const getUserId = (): string => {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};

const formatDanmakuTime = (timestamp: number, locale: string): string => {
  const date = new Date(timestamp);
  const now = new Date();

  const isSameDay = date.toDateString() === now.toDateString();
  const isSameYear = date.getFullYear() === now.getFullYear();
  const localeTag = locale === 'zh' ? 'zh-CN' : 'en-US';

  if (isSameDay) {
    return date.toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' });
  } else if (isSameYear) {
    return date.toLocaleDateString(localeTag, { month: '2-digit', day: '2-digit' });
  } else {
    return date.toLocaleDateString(localeTag, { year: 'numeric', month: '2-digit', day: '2-digit' });
  }
};

export function DanmakuSatellite({ viewer, setIsRotationPaused }: DanmakuSatelliteProps) {
  const { t, tReplace, locale } = useTranslation();
  const [danmakus, setDanmakus] = useState<Danmaku[]>([]);
  const [inputText, setInputText] = useState('');
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingQuota, setRemainingQuota] = useState({ perMinute: RATE_LIMIT.maxPerMinute, perHour: RATE_LIMIT.maxPerHour });
  const [selectedOrbit, setSelectedOrbit] = useState<OrbitType>('medium');

  // Markdown text input
  const [markdownText, setMarkdownText] = useState('');
  const [showMarkdownInput, setShowMarkdownInput] = useState(false);

  // Markdown content display
  const [selectedDanmaku, setSelectedDanmaku] = useState<Danmaku | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // controls modal visibility

  // Visibility toggles for text, satellite and orbit line
  const [showText, setShowText] = useState(true);
  const [showSatellite, setShowSatellite] = useState(true);
  const [showOrbitLine, setShowOrbitLine] = useState(true);
  // Master toggle
  const [showAll, setShowAll] = useState(true);

  // BeiDou satellite data
  const [beidouSatellites, setBeidouSatellites] = useState<Danmaku[]>([]);
  const [showBeidou, setShowBeidou] = useState(false);

  // Danmaku list expand/collapse
  const [isDanmakuListOpen, setIsDanmakuListOpen] = useState(false);

  // Danmaku list filter - show only my own
  const [filterOwnDanmakus, setFilterOwnDanmakus] = useState(false);

  const userId = useRef(getUserId());
  const entitiesRef = useRef<Map<string, Cesium.Entity>>(new Map());
  const orbitEntitiesRef = useRef<Map<string, Cesium.Entity>>(new Map());
  const rateLimiterRef = useRef(new RateLimiter());
  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(false);
  const hasLoadedDanmakusRef = useRef(false); // marks whether danmaku data has been loaded

  const getRandomColor = () => {
    const hue = Math.random() * 360;
    const saturation = 70 + Math.random() * 30;
    const lightness = 50 + Math.random() * 30;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // Calculate angular velocity from Kepler's law: ω ∝ r^(-3/2)
  // Returns radians rotated per second
  const calculateAngularVelocity = (altitude: number): number => {
    const radius = EARTH_RADIUS + altitude;
    const referenceRadius = EARTH_RADIUS + 400000;
    const referenceOmega = 0.0012;
    const omega = referenceOmega * Math.pow(referenceRadius / radius, 1.5);
    // Visual speedup: 50x (real orbits are high and need acceleration to be visible)
    return omega * 50;
  };

  // Randomly select an orbit type (low/medium/high with equal 1/3 probability)
  const getRandomOrbitType = (): OrbitType => {
    const types: OrbitType[] = ['low', 'medium', 'high'];
    return types[Math.floor(Math.random() * 3)];
  };

  const generateOrbitParams = useCallback((orbitType?: OrbitType) => {
    // Use a random type when none is specified (equal 1/3 probability)
    const type = orbitType || getRandomOrbitType();
    const range = ORBIT_RANGES[type];

    // Initial angle: uniformly distributed 0-360 degrees
    const angle = Math.random() * Math.PI * 2;

    // Orbital inclination: uniformly distributed -90° to +90° (equator to polar)
    const inclination = (Math.random() - 0.5) * Math.PI;

    // Right Ascension of Ascending Node: uniformly distributed 0-360 degrees
    const raan = Math.random() * Math.PI * 2;

    // Altitude: uniformly distributed within the orbit range
    const altitude = range.min + Math.random() * (range.max - range.min);

    // Angular velocity: calculated from altitude (low orbits are fast, high orbits are slow)
    const angularVelocity = calculateAngularVelocity(altitude);

    // Direction: 50% chance of prograde/retrograde
    const speed = angularVelocity * (Math.random() > 0.5 ? 1 : -1);

    return { angle, inclination, altitude, speed, orbitType: type, raan };
  }, []);

  // Load BeiDou satellite data from local JSON
  const loadBeidouSatellites = useCallback(async () => {
    if (beidouSatellites.length > 0) return; // already loaded

    try {
      debugLog('Loading Beidou satellites...');
      const response = await fetch('/data/beidou-satellites.json');
      if (response.ok) {
        const satellites = await response.json();
        setBeidouSatellites(satellites);
        debugLog('Loaded Beidou satellites:', satellites.length);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Danmaku] Failed to load Beidou satellites:', err);
      }
    }
  }, [beidouSatellites.length]);

  const fetchDanmakus = useCallback(async (force = false) => {
    // Return cached data when already loaded and not forcing a refresh
    if (hasLoadedDanmakusRef.current && !force) {
      debugLog('Using cached danmakus from memory, count:', danmakus.length);
      return;
    }

    if (isFetchingRef.current) return;

    const url = `${API_BASE_URL}/list`;
    debugLog('Fetching danmakus from:', url);

    isFetchingRef.current = true;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        debugLog('Fetched danmakus count:', data.length);
        // Backfill orbit parameters and timestamp for legacy data
        const processedData = data.map((d: Partial<Danmaku>) => {
          // Use server-provided orbit parameters when complete
          const hasOrbitParams = d.angle != null && d.inclination != null && d.altitude != null && d.speed != null;
          const orbitParams = hasOrbitParams
            ? {}  // keep server values
            : (d.orbitType ? generateOrbitParams(d.orbitType) : generateOrbitParams('medium'));
          return {
            ...orbitParams,
            timestamp: Date.now(), // fallback to current time when missing
            ...d,
            // Ensure required fields have defaults when missing from server
            id: d.id || `danmaku-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: d.text || '',
            userId: d.userId || 'unknown',
            color: d.color || '#60a5fa',
            // Generate a random RAAN when the server does not provide one
            raan: d.raan != null ? d.raan : Math.random() * Math.PI * 2,
          } as Danmaku;
        });
        setDanmakus(processedData);
        hasLoadedDanmakusRef.current = true; // mark as loaded
      }
    } catch (error) {
      // Keep empty state silently when the danmaku API is unavailable; warn only in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Danmaku] Failed to fetch danmakus:', error);
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [generateOrbitParams, danmakus.length]);

  const addDanmaku = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const rateCheck = rateLimiterRef.current.canSend();
    if (!rateCheck.allowed) {
      const message = rateCheck.reason === 'tooFast' && rateCheck.waitTime !== undefined
        ? tReplace(t.earth.rateLimitWait, { seconds: Math.ceil(rateCheck.waitTime / 1000) })
        : t.earth.rateLimit;
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const orbitParams = generateOrbitParams(selectedOrbit);
    const newDanmaku: Danmaku = {
      id: `danmaku-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.trim(),
      userId: userId.current,
      timestamp: Date.now(),
      color: getRandomColor(),
      ...orbitParams,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...await generateAuthHeaders(),
        },
        body: JSON.stringify({
          ...newDanmaku,
          markdown: markdownText.trim(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          rateLimiterRef.current.recordSend();
          // Append the new danmaku to the list without removing previous ones
          setDanmakus(prev => [...prev, result.danmaku || newDanmaku]);
          setInputText('');
          setMarkdownText('');
          setShowMarkdownInput(false);
          setRemainingQuota(rateLimiterRef.current.getRemainingQuota());
          // Avoid refetching to save bandwidth and request quota
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setErrorMessage(errorData.error || t.earth.sendFailed);
        setTimeout(() => setErrorMessage(null), 3000);
      }
    } catch {
      setErrorMessage(t.earth.networkError);
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  }, [selectedOrbit, generateOrbitParams, markdownText, t, tReplace]);

  const deleteDanmaku = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...await generateAuthHeaders(),
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setDanmakus(prev => prev.filter(d => d.id !== id));
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Danmaku] Failed to delete danmaku:', error);
      }
    }
  }, []);

  const handleSend = useCallback(() => {
    if (inputText.trim() && !isLoading) {
      addDanmaku(inputText);
    }
  }, [inputText, isLoading, addDanmaku]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Show Markdown content (read directly from already loaded data)
  const showDanmakuDetail = useCallback((danmaku: Danmaku) => {
    // Toggle off when clicking the same satellite again
    if (selectedDanmaku?.id === danmaku.id) {
      setSelectedDanmaku(null);
      setMarkdownContent(null);
      setIsModalOpen(false);
      return;
    }

    setSelectedDanmaku(danmaku);
    // Read markdown directly from the danmaku data without extra requests
    setMarkdownContent(danmaku.markdown || null);
    setIsModalOpen(false);
  }, [selectedDanmaku, viewer, setIsRotationPaused]);

  // Handle satellite click events
  useEffect(() => {
    if (!viewer) return;

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const pickedObject = viewer.scene.pick(click.position);

      if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id)) {
        const entity = pickedObject.id;
        // Find the matching danmaku data
        const allSatellites = showBeidou ? [...danmakus, ...beidouSatellites] : danmakus;
        const danmaku = allSatellites.find(d => {
          const entityFromRef = entitiesRef.current.get(d.id);
          return entityFromRef && entityFromRef.id === entity.id;
        });

        if (danmaku) {
          showDanmakuDetail(danmaku);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
    };
  }, [viewer, danmakus, beidouSatellites, showBeidou, showDanmakuDetail]);

  // Master toggle controls all visibility states
  const toggleAll = useCallback(() => {
    const newValue = !showAll;
    setShowAll(newValue);
    setShowText(newValue);
    setShowSatellite(newValue);
    setShowOrbitLine(newValue);
  }, [showAll]);

  useEffect(() => {
    if (isMountedRef.current) return;
    isMountedRef.current = true;

    // Fetch data on first mount
    fetchDanmakus();
  }, [fetchDanmakus]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingQuota(rateLimiterRef.current.getRemainingQuota());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // The input panel uses cached memory data instead of refetching
  // Manual refresh or periodic refresh can be added here if needed

  // Create and update Cesium entities
  useEffect(() => {
    if (!viewer) return;

    // Merge user danmaku and BeiDou satellites when enabled
    const allSatellites = showBeidou
      ? [...danmakus, ...beidouSatellites]
      : danmakus;

    // Calculate satellite position (accounting for RAAN)
    const calculatePosition = (danmaku: Danmaku, elapsedSeconds: number) => {
      const radius = EARTH_RADIUS + danmaku.altitude;
      // speed is already rad/s, multiply by elapsed seconds for rotated angle
      const currentAngle = danmaku.angle + (danmaku.speed * elapsedSeconds);

      // Coordinates within the orbital plane
      const xOrbital = Math.cos(currentAngle) * radius;
      const yOrbital = Math.sin(currentAngle) * radius;

      const inclination = danmaku.inclination;
      const raan = danmaku.raan || 0; // RAAN defaults to 0

      // Apply inclination rotation (around x-axis) and RAAN rotation (around z-axis)
      // Step 1: apply inclination (rotate around x-axis)
      const yAfterInclination = yOrbital * Math.cos(inclination);
      const zAfterInclination = yOrbital * Math.sin(inclination);

      // Step 2: apply RAAN (rotate around z-axis)
      const cosRaan = Math.cos(raan);
      const sinRaan = Math.sin(raan);
      const x = xOrbital * cosRaan - yAfterInclination * sinRaan;
      const y = xOrbital * sinRaan + yAfterInclination * cosRaan;
      const z = zAfterInclination;

      return new Cesium.Cartesian3(x, y, z);
    };

    // Create a satellite entity containing text and a point
    const createSatelliteEntity = (danmaku: Danmaku) => {
      const entity = viewer.entities.add({
        position: new Cesium.CallbackProperty(() => {
          const now = Date.now();
          const elapsed = (now - danmaku.timestamp) / 1000;
          return calculatePosition(danmaku, elapsed);
        }, false) as unknown as Cesium.PositionProperty,
        point: {
          pixelSize: 8,
          color: Cesium.Color.fromCssColorString(danmaku.color),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1.5e7, 1.5, 5.0e7, 0.8),
          show: showSatellite && showAll,
        },
        label: {
          text: danmaku.text,
          font: 'bold 14px "Microsoft YaHei", sans-serif',
          fillColor: Cesium.Color.fromCssColorString(danmaku.color),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -25),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          show: showText && showAll,
          scaleByDistance: new Cesium.NearFarScalar(1.5e7, 1.0, 5.0e7, 0.7),
          translucencyByDistance: new Cesium.NearFarScalar(3.0e7, 1.0, 5.0e7, 0.5),
        },
      });
      return entity;
    };

    // Create orbit line (accounting for RAAN)
    const createOrbitLine = (danmaku: Danmaku) => {
      const radius = EARTH_RADIUS + danmaku.altitude;
      const inclination = danmaku.inclination;
      const angleOffset = danmaku.angle;
      const raan = danmaku.raan || 0;
      const cosRaan = Math.cos(raan);
      const sinRaan = Math.sin(raan);

      const positions: Cesium.Cartesian3[] = [];
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2 + angleOffset;
        const xOrbital = Math.cos(theta) * radius;
        const yOrbital = Math.sin(theta) * radius;

        // Apply inclination (around x-axis)
        const yAfterInclination = yOrbital * Math.cos(inclination);
        const zAfterInclination = yOrbital * Math.sin(inclination);

        // Apply RAAN (around z-axis)
        const x = xOrbital * cosRaan - yAfterInclination * sinRaan;
        const y = xOrbital * sinRaan + yAfterInclination * cosRaan;
        const z = zAfterInclination;

        positions.push(new Cesium.Cartesian3(x, y, z));
      }

      const entity = viewer.entities.add({
        polyline: {
          positions: positions,
          width: 1.5,
          material: new Cesium.PolylineDashMaterialProperty({
            color: Cesium.Color.fromCssColorString(danmaku.color).withAlpha(0.4),
            dashLength: 16,
          }),
          show: showOrbitLine && showAll,
        },
      });
      return entity;
    };

    // Check viewer validity to avoid accessing a destroyed viewer during route changes
    const isViewerValid = viewer && !viewer.isDestroyed?.();
    
    if (isViewerValid && viewer.entities) {
      allSatellites.forEach(danmaku => {
        if (!entitiesRef.current.has(danmaku.id)) {
          try {
            const entity = createSatelliteEntity(danmaku);
            if (entity) entitiesRef.current.set(danmaku.id, entity);
          } catch {
            // Ignore errors during viewer destruction
          }
        }
        if (!orbitEntitiesRef.current.has(danmaku.id)) {
          try {
            const orbitEntity = createOrbitLine(danmaku);
            if (orbitEntity) orbitEntitiesRef.current.set(danmaku.id, orbitEntity);
          } catch {
            // Ignore errors during viewer destruction
          }
        }
      });
    }

    const currentIds = new Set(allSatellites.map(d => d.id));
    
    if (isViewerValid && viewer.entities) {
      entitiesRef.current.forEach((entity, id) => {
        if (!currentIds.has(id)) {
          viewer.entities.remove(entity);
          entitiesRef.current.delete(id);
        }
      });
      orbitEntitiesRef.current.forEach((entity, id) => {
        if (!currentIds.has(id)) {
          viewer.entities.remove(entity);
          orbitEntitiesRef.current.delete(id);
        }
      });
    } else if (!isViewerValid) {
      // Viewer destroyed; clear local references
      entitiesRef.current.clear();
      orbitEntitiesRef.current.clear();
    }

    // Update visibility
    entitiesRef.current.forEach((entity) => {
      if (entity.point) entity.point.show = new Cesium.ConstantProperty(showSatellite && showAll);
      if (entity.label) entity.label.show = new Cesium.ConstantProperty(showText && showAll);
    });
    orbitEntitiesRef.current.forEach((entity) => {
      if (entity.polyline) entity.polyline.show = new Cesium.ConstantProperty(showOrbitLine && showAll);
    });

    return () => {
      // Verify viewer exists and is not destroyed to avoid undefined errors on route change
      const isViewerValid = viewer && !viewer.isDestroyed?.();
      if (isViewerValid && viewer.entities) {
        entitiesRef.current.forEach((entity) => {
          try {
            viewer.entities.remove(entity);
          } catch {
            // Ignore entity removal errors
          }
        });
        orbitEntitiesRef.current.forEach((entity) => {
          try {
            viewer.entities.remove(entity);
          } catch {
            // Ignore entity removal errors
          }
        });
      }
      entitiesRef.current.clear();
      orbitEntitiesRef.current.clear();
    };
  }, [viewer, danmakus, beidouSatellites, showBeidou, showText, showSatellite, showOrbitLine, showAll]);

  const myDanmakus = danmakus.filter(d => d.userId === userId.current);

  return (
    // Move to top-left to avoid covering bottom-left data
    <div className="absolute top-4 left-4 z-30">
      <div className="flex flex-col gap-2">
        {/* Main control bar */}
        <div className="flex items-center gap-2">
          {/* Master toggle */}
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: showAll ? 'rgba(96, 165, 250, 0.3)' : 'rgba(0, 0, 0, 0.5)',
              border: showAll ? '1px solid rgba(96, 165, 250, 0.5)' : '1px solid rgba(96, 165, 250, 0.2)',
              color: showAll ? '#60a5fa' : '#94a3b8',
            }}
            title={showAll ? t.earth.hideAll : t.earth.showAll}
          >
            {showAll ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {showAll ? tReplace(t.earth.satelliteCount, { count: danmakus.length + (showBeidou ? beidouSatellites.length : 0) }) : t.earth.hidden}
            </span>
          </button>

          <button
            onClick={() => {
              setIsInputVisible(prev => {
                const newValue = !prev;
                if (newValue) {
                  setIsDanmakuListOpen(false);
                }
                return newValue;
              });
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
              color: '#60a5fa',
            }}
            title={t.earth.sendDanmaku}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Detailed controls - shown only when all effects are enabled */}
        {showAll && (
          <div className="flex items-center gap-2 justify-end">
            {/* Text toggle */}
            <button
              onClick={() => setShowText(prev => !prev)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: showText ? '1px solid rgba(96, 165, 250, 0.5)' : '1px solid rgba(96, 165, 250, 0.2)',
                color: showText ? '#60a5fa' : '#64748b',
              }}
              title={t.earth.text}
            >
              <Type className="w-3.5 h-3.5" />
              <span className="text-xs">{t.earth.textShort}</span>
            </button>

            {/* Satellite toggle */}
            <button
              onClick={() => setShowSatellite(prev => !prev)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: showSatellite ? '1px solid rgba(96, 165, 250, 0.5)' : '1px solid rgba(96, 165, 250, 0.2)',
                color: showSatellite ? '#60a5fa' : '#64748b',
              }}
              title={t.earth.satellite}
            >
              <Satellite className="w-3.5 h-3.5" />
              <span className="text-xs">{t.earth.satelliteShort}</span>
            </button>

            {/* Orbit toggle */}
            <button
              onClick={() => setShowOrbitLine(prev => !prev)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: showOrbitLine ? '1px solid rgba(96, 165, 250, 0.5)' : '1px solid rgba(96, 165, 250, 0.2)',
                color: showOrbitLine ? '#60a5fa' : '#64748b',
              }}
              title={t.earth.orbit}
            >
              <Orbit className="w-3.5 h-3.5" />
              <span className="text-xs">{t.earth.orbitShort}</span>
            </button>

            {/* BeiDou toggle */}
            <button
              onClick={() => {
                if (!showBeidou) {
                  loadBeidouSatellites();
                }
                setShowBeidou(prev => !prev);
              }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: showBeidou ? '1px solid rgba(234, 179, 8, 0.5)' : '1px solid rgba(96, 165, 250, 0.2)',
                color: showBeidou ? '#eab308' : '#64748b',
              }}
              title={t.earth.beidouSatellites}
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="text-xs">{t.earth.beidouShort}</span>
            </button>

            {/* Danmaku list toggle */}
            <button
              onClick={() => {
                setIsDanmakuListOpen(prev => {
                  const newValue = !prev;
                  if (newValue) {
                    setIsInputVisible(false);
                  }
                  return newValue;
                });
              }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: isDanmakuListOpen ? '1px solid rgba(96, 165, 250, 0.5)' : '1px solid rgba(96, 165, 250, 0.2)',
                color: isDanmakuListOpen ? '#60a5fa' : '#64748b',
              }}
              title={t.earth.satelliteList}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="text-xs">{t.earth.listShort}</span>
            </button>
          </div>
        )}

        {/* Danmaku list */}
        {isDanmakuListOpen && (
          <div
            className="flex flex-col rounded-lg backdrop-blur-sm overflow-hidden"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
              minWidth: '280px',
              maxHeight: '400px',
            }}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'rgba(96, 165, 250, 0.2)' }}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: '#60a5fa' }} />
                <span className="text-sm font-medium" style={{ color: '#60a5fa' }}>{t.earth.satelliteList}</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(96, 165, 250, 0.2)', color: '#94a3b8' }}>
                  {filterOwnDanmakus ? danmakus.filter(d => d.userId === userId.current).length : danmakus.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilterOwnDanmakus(prev => !prev)}
                  className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors"
                  title={filterOwnDanmakus ? t.earth.showAllDanmaku : t.earth.showMine}
                >
                  <Eye className="w-3.5 h-3.5" style={{ color: filterOwnDanmakus ? '#60a5fa' : '#64748b' }} />
                </button>
                <button
                  onClick={() => setIsDanmakuListOpen(false)}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {(() => {
                const filteredDanmakus = filterOwnDanmakus
                  ? danmakus.filter(d => d.userId === userId.current)
                  : danmakus;

                if (filteredDanmakus.length === 0) {
                  return (
                    <div className="flex items-center justify-center h-20 text-gray-500 text-sm">
                      {filterOwnDanmakus ? t.earth.noMyDanmaku : t.earth.noDanmaku}
                    </div>
                  );
                }

                return filteredDanmakus
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((danmaku) => {
                    const isOwnDanmaku = danmaku.userId === userId.current;
                    return (
                      <div
                        key={danmaku.id}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 transition-colors border-b"
                        style={{ borderColor: 'rgba(96, 165, 250, 0.1)' }}
                      >
                        <button
                          onClick={() => {
                            if (selectedDanmaku?.id === danmaku.id) {
                              setSelectedDanmaku(null);
                              setMarkdownContent(null);
                              setIsModalOpen(false);
                              return;
                            }

                            setSelectedDanmaku(danmaku);
                            setMarkdownContent(danmaku.markdown || null);
                            setIsModalOpen(false);
                          }}
                          className="flex items-center gap-2 flex-1 min-w-0"
                        >
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: danmaku.color }} />
                          <span className="flex-1 text-left text-xs truncate" style={{ color: '#e2e8f0' }}>
                            {danmaku.text}
                          </span>
                          <span className="text-[10px] flex-shrink-0" style={{ color: '#64748b' }}>
                            {formatDanmakuTime(danmaku.timestamp, locale)}
                          </span>
                        </button>
                        {isOwnDanmaku && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteDanmaku(danmaku.id);
                            }}
                            className="p-1 rounded hover:bg-red-500/20 transition-colors flex-shrink-0"
                            title={t.earth.deleteDanmaku}
                          >
                            <X className="w-3 h-3 text-red-400" />
                          </button>
                        )}
                      </div>
                    );
                  });
              })()}
            </div>
          </div>
        )}

        {/* Markdown content sidebar - compact semi-transparent version */}
        {selectedDanmaku && !isModalOpen && (
          <div
            className="fixed right-4 top-1/2 -translate-y-1/2 w-64 z-40 flex flex-col rounded-lg backdrop-blur-sm overflow-hidden"
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(96, 165, 250, 0.2)',
              maxHeight: '320px',
            }}
          >
            {/* Header with title and buttons */}
            <div className="flex items-center justify-between px-2 py-1.5 border-b" style={{ borderColor: 'rgba(96, 165, 250, 0.15)' }}>
              <div className="flex items-center gap-1.5 min-w-0">
                <Satellite className="w-3 h-3 flex-shrink-0" style={{ color: selectedDanmaku.color }} />
                <span className="font-bold text-xs truncate" style={{ color: selectedDanmaku.color }}>
                  {selectedDanmaku.text}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                {/* Modal button */}
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                  title={t.earth.clickToViewFull}
                >
                  <Maximize2 className="w-3 h-3 text-gray-400" />
                </button>
                {/* Close button */}
                <button
                  onClick={() => {
                    setSelectedDanmaku(null);
                    setIsRotationPaused(false);
                  }}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-auto p-2 text-gray-200 text-xs leading-relaxed">
              {/* Satellite parameters */}
              <div className="mb-2 p-1.5 rounded" style={{ background: 'rgba(96, 165, 250, 0.1)' }}>
                <div className="text-[10px] text-gray-400 mb-1">{t.earth.orbitParams.title}</div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                  <span className="text-gray-500">{t.earth.orbitParams.type}:</span>
                  <span className="text-gray-300">{t.earth.orbitParams.orbitTypes[selectedDanmaku.orbitType || 'medium']}</span>
                  <span className="text-gray-500">{t.earth.orbitParams.altitude}:</span>
                  <span className="text-gray-300">{(selectedDanmaku.altitude / 1000).toFixed(0)} km</span>
                  <span className="text-gray-500">{t.earth.orbitParams.inclination}:</span>
                  <span className="text-gray-300">{(selectedDanmaku.inclination * 180 / Math.PI).toFixed(1)}°</span>
                  <span className="text-gray-500">{t.earth.orbitParams.speed}:</span>
                  <span className="text-gray-300">{(selectedDanmaku.speed * 1000).toFixed(2)} rad/s</span>
                </div>
              </div>

              {/* Markdown content - truncated display */}
              {markdownContent ? (
                <div>
                  <div className="text-[10px] text-gray-400 mb-1">{t.earth.detailedContent}</div>
                  <div className="line-clamp-6">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => <h1 className="text-xs font-bold text-white mb-1">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xs font-semibold text-white mt-2 mb-0.5">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-[10px] font-medium text-white mt-1 mb-0.5">{children}</h3>,
                        p: ({ children }) => <p className="mb-1 text-gray-300 text-[10px]">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-3 mb-1 space-y-0 text-[10px]">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-3 mb-1 space-y-0 text-[10px]">{children}</ol>,
                        li: ({ children }) => <li className="text-gray-300">{children}</li>,
                        code: ({ children }) => <code className="bg-gray-800 px-0.5 rounded text-[9px] font-mono text-blue-300">{children}</code>,
                        pre: ({ children }) => <pre className="bg-gray-800 p-1 rounded overflow-x-auto mb-1 text-[9px]">{children}</pre>,
                        blockquote: ({ children }) => <blockquote className="border-l border-blue-500 pl-2 italic text-gray-400 my-1 text-[10px]">{children}</blockquote>,
                        a: ({ children, href }) => <a href={href} className="text-blue-400 hover:text-blue-300 underline text-[10px]" target="_blank" rel="noopener noreferrer">{children}</a>,
                        hr: () => <hr className="border-gray-700 my-1" />,
                      }}
                    >{markdownContent.length > 150 ? markdownContent.slice(0, 150) + '...' : markdownContent}</ReactMarkdown>
                  </div>
                  {markdownContent.length > 150 && (
                    <div className="mt-1 text-[10px] text-blue-400 cursor-pointer hover:text-blue-300" onClick={() => setIsModalOpen(true)}>
                      {t.earth.expandFullContent}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-[10px]">{t.earth.noDetailedContent}</p>
              )}
            </div>
          </div>
        )}

        {/* Markdown content modal - full display */}
        {isModalOpen && selectedDanmaku && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.7)' }}
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="max-w-2xl w-full max-h-[85vh] overflow-auto rounded-lg backdrop-blur-md p-5"
              style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(96, 165, 250, 0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Satellite className="w-4 h-4" style={{ color: selectedDanmaku.color }} />
                  <span className="text-base font-bold" style={{ color: selectedDanmaku.color }}>
                    {selectedDanmaku.text}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(96, 165, 250, 0.2)', color: '#94a3b8' }}>
                    {t.earth.orbitParams.orbitTypes[selectedDanmaku.orbitType || 'medium']}
                  </span>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Full satellite parameters */}
              <div className="mb-3 p-2 rounded" style={{ background: 'rgba(96, 165, 250, 0.1)' }}>
                <div className="text-xs text-gray-400 mb-1.5">{t.earth.orbitParams.title}</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t.earth.orbitTypeLabel}:</span>
                    <span className="text-gray-300">{t.earth.orbitParams.orbitTypes[selectedDanmaku.orbitType || 'medium']}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t.earth.orbitAltitudeLabel}:</span>
                    <span className="text-gray-300">{(selectedDanmaku.altitude / 1000).toFixed(0)} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t.earth.orbitInclinationLabel}:</span>
                    <span className="text-gray-300">{(selectedDanmaku.inclination * 180 / Math.PI).toFixed(2)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t.earth.angularVelocityLabel}:</span>
                    <span className="text-gray-300">{(selectedDanmaku.speed * 1000).toFixed(3)} rad/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t.earth.initialAngleLabel}:</span>
                    <span className="text-gray-300">{(selectedDanmaku.angle * 180 / Math.PI).toFixed(2)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t.earth.raanLabel}:</span>
                    <span className="text-gray-300">{((selectedDanmaku.raan || 0) * 180 / Math.PI).toFixed(2)}°</span>
                  </div>
                </div>
              </div>

              <div className="text-gray-200 text-sm leading-relaxed">
                {markdownContent ? (
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-lg font-bold text-white mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-base font-semibold text-white mt-3 mb-1.5">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-medium text-white mt-2 mb-1">{children}</h3>,
                      p: ({ children }) => <p className="mb-2 text-gray-300 text-xs">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5 text-xs">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5 text-xs">{children}</ol>,
                      li: ({ children }) => <li className="text-gray-300">{children}</li>,
                      code: ({ children }) => <code className="bg-gray-800 px-1 py-0.5 rounded text-[10px] font-mono text-blue-300">{children}</code>,
                      pre: ({ children }) => <pre className="bg-gray-800 p-2 rounded-lg overflow-x-auto mb-2 text-xs">{children}</pre>,
                      blockquote: ({ children }) => <blockquote className="border-l-2 border-blue-500 pl-3 italic text-gray-400 my-2 text-xs">{children}</blockquote>,
                      a: ({ children, href }) => <a href={href} className="text-blue-400 hover:text-blue-300 underline text-xs" target="_blank" rel="noopener noreferrer">{children}</a>,
                      hr: () => <hr className="border-gray-700 my-2" />,
                    }}
                  >{markdownContent}</ReactMarkdown>
                ) : (
                  <p className="text-gray-500 text-xs">{t.earth.noDetailedContent}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {isInputVisible && (
          <div
            className="flex flex-col gap-2 p-3 rounded-lg backdrop-blur-sm"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
              minWidth: '280px',
            }}
          >
            {errorMessage && (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded text-sm" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Orbit altitude selection */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-gray-400">{t.earth.orbitAltitude}</span>
              <div className="flex gap-2">
                {(Object.keys(ORBIT_RANGES) as OrbitType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedOrbit(type)}
                    className="flex-1 px-2 py-1.5 rounded text-xs transition-all duration-200"
                    style={{
                      background: selectedOrbit === type ? 'rgba(96, 165, 250, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                      border: selectedOrbit === type ? '1px solid rgba(96, 165, 250, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: selectedOrbit === type ? '#60a5fa' : '#94a3b8',
                    }}
                  >
                    <div className="font-medium">{t.earth.orbitParams.orbitTypes[type]}</div>
                    <div className="text-[10px] opacity-70">{ORBIT_RANGES[type].desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.earth.danmakuPlaceholder}
              maxLength={15}
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-md text-sm text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(96, 165, 250, 0.3)',
              }}
            />

            {/* Markdown 文本开关 */}
            <button
              onClick={() => setShowMarkdownInput(prev => !prev)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-all duration-200"
              style={{
                background: showMarkdownInput ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
                color: showMarkdownInput ? '#60a5fa' : '#94a3b8',
              }}
            >
              <FileText className="w-3.5 h-3.5" />
              {showMarkdownInput ? t.earth.collapseMarkdown : t.earth.addMarkdown}
            </button>

            {/* Markdown input field */}
            {showMarkdownInput && (
              <>
                <textarea
                  value={markdownText}
                  onChange={(e) => setMarkdownText(e.target.value)}
                  placeholder={t.earth.markdownPlaceholder}
                  rows={4}
                  maxLength={300}
                  disabled={isLoading}
                  className="w-full px-3 py-2 rounded-md text-sm text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 resize-none"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(96, 165, 250, 0.3)',
                  }}
                />
                <div className="text-xs text-gray-500 text-right">
                  {markdownText.length}/300
                </div>
              </>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {inputText.length}/15
              </span>
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: inputText.trim() && !isLoading ? 'rgba(96, 165, 250, 0.3)' : 'rgba(96, 165, 250, 0.1)',
                  border: '1px solid rgba(96, 165, 250, 0.3)',
                  color: '#60a5fa',
                }}
              >
                {isLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#60a5fa', borderTopColor: 'transparent' }} />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    {t.earth.send}
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
              <span>{tReplace(t.earth.quotaPerMinute, { count: remainingQuota.perMinute })}</span>
              <span>{tReplace(t.earth.quotaPerHour, { count: remainingQuota.perHour })}</span>
            </div>

            {myDanmakus.length > 0 && (
              <div className="mt-2 pt-2 border-t" style={{ borderColor: 'rgba(96, 165, 250, 0.2)' }}>
                <div className="text-xs text-gray-400 mb-2">我的弹幕 (可删除)</div>
                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                  {myDanmakus.map(danmaku => (
                    <div
                      key={danmaku.id}
                      className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-sm"
                      style={{
                        background: 'rgba(96, 165, 250, 0.1)',
                        border: '1px solid rgba(96, 165, 250, 0.2)',
                      }}
                    >
                      <span className="flex-1 truncate" style={{ color: danmaku.color }}>
                        [{t.earth.orbitParams.orbitTypes[danmaku.orbitType || 'medium']}] {danmaku.text}
                      </span>
                      <button
                        onClick={() => deleteDanmaku(danmaku.id)}
                        className="p-1 rounded hover:bg-red-500/20 transition-colors"
                        style={{ color: '#ef4444' }}
                        title={t.earth.delete}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DanmakuSatellite;
