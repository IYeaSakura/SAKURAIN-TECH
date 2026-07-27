'use client';

/**
 * Moments page —— WeChat Moments-style gallery timeline.
 *
 * Moments are grouped into a single-column feed where each entry has an avatar,
 * nickname, caption, image grid and location. Tapping any image opens the
 * lightbox viewer.
 */

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, MapPin, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAnimationEnabled, useNavigation, useTranslation } from '@/hooks';
import type { MomentData, MomentEntry, MomentImage } from '@/types';

const PIXEL_BORDER = '2px solid var(--border-subtle)';
const PIXEL_SHADOW = '4px 4px 0 var(--border-subtle)';
const AVATAR_SRC = '/image/about/head.jpg';
const NICKNAME = 'Yuyang';

export function MomentsPage() {
  const animationEnabled = useAnimationEnabled();
  const { navigateTo } = useNavigation();
  const { t } = useTranslation();
  const [data, setData] = useState<MomentData | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch('/data/moments.json')
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const entries = useMemo(() => {
    const list = data?.entries ?? [];
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [data]);

  const allPhotos = useMemo(() => {
    return entries.flatMap((entry) => entry.photos);
  }, [entries]);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const prevPhoto = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + allPhotos.length) % allPhotos.length);
  };

  const nextPhoto = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % allPhotos.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'ArrowRight') nextPhoto();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, allPhotos.length]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center font-mono">
          <div
            className="w-10 h-10 border-2 border-t-transparent animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
          />
          <p style={{ color: 'var(--text-muted)' }}>{'>'} loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 lg:py-28">
        {/* Header */}
        <motion.header
          initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <button
            onClick={() => navigateTo('/')}
            className="inline-flex items-center gap-2 px-2 py-1 rounded-sm text-xs font-bold uppercase tracking-wider transition-opacity hover:opacity-70 mb-6"
            style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            {t.moments.backToHome}
          </button>
          <div className="flex items-center gap-3 mb-3">
            <Camera className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
            <h1
              className="text-3xl sm:text-4xl font-bold uppercase"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
            >
              {data.title}
            </h1>
          </div>
          <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            {data.description}
          </p>
        </motion.header>

        {/* Moments feed */}
        {entries.length === 0 ? (
          <div
            className="p-8 text-center text-sm rounded-sm"
            style={{
              background: 'var(--bg-secondary)',
              border: PIXEL_BORDER,
              boxShadow: PIXEL_SHADOW,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {t.moments.noMoments}
          </div>
        ) : (
          <div className="space-y-8">
            {entries.map((entry, entryIndex) => (
              <MomentEntry
                key={entry.id}
                entry={entry}
                entryIndex={entryIndex}
                animationEnabled={animationEnabled}
                allPhotos={allPhotos}
                onOpen={openLightbox}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
            style={{ background: 'rgba(0,0,0,0.92)' }}
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 border-2"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
              aria-label={t.common.close}
            >
              <X className="w-5 h-5" />
            </button>

            {allPhotos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevPhoto();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 border-2 hidden sm:block"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                  aria-label={t.moments.previousMoment}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextPhoto();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 border-2 hidden sm:block"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                  aria-label={t.moments.nextMoment}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="max-w-5xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={allPhotos[lightboxIndex].src}
                alt=""
                className="w-full max-h-[80vh] object-contain border-2"
                style={{ borderColor: 'var(--border-subtle)' }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MomentEntry({
  entry,
  entryIndex,
  animationEnabled,
  allPhotos,
  onOpen,
}: {
  entry: MomentEntry;
  entryIndex: number;
  animationEnabled: boolean;
  allPhotos: MomentImage[];
  onOpen: (globalIndex: number) => void;
}) {
  const { locale } = useTranslation();
  const { caption, date, location, photos } = entry;
  const captionText = caption[locale];
  const locationText = location[locale];

  return (
    <motion.article
      initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: entryIndex * 0.05 }}
      className="flex gap-4 pb-8 border-b-2"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      {/* Avatar */}
      <div
        className="shrink-0 w-12 h-12 overflow-hidden rounded-sm"
        style={{ border: PIXEL_BORDER }}
      >
        <img src={AVATAR_SRC} alt={NICKNAME} className="w-full h-full object-cover" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h2
          className="text-sm font-bold mb-1"
          style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}
        >
          {NICKNAME}
        </h2>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {date}
        </p>

        {captionText && (
          <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {captionText}
          </p>
        )}

        <PhotoGrid photos={photos} allPhotos={allPhotos} onOpen={onOpen} />

        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {locationText && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {locationText}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function PhotoGrid({
  photos,
  allPhotos,
  onOpen,
}: {
  photos: MomentImage[];
  allPhotos: MomentImage[];
  onOpen: (globalIndex: number) => void;
}) {
  const count = photos.length;

  const getGlobalIndex = (photo: MomentImage) => allPhotos.findIndex((p) => p.id === photo.id);

  if (count === 1) {
    return (
      <div
        className="cursor-pointer overflow-hidden rounded-sm max-w-[70%]"
        style={{ border: PIXEL_BORDER }}
        onClick={() => onOpen(getGlobalIndex(photos[0]))}
      >
        <img
          src={photos[0].src}
          alt=""
          className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 max-w-[80%]">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="cursor-pointer overflow-hidden rounded-sm aspect-square"
            style={{ border: PIXEL_BORDER }}
            onClick={() => onOpen(getGlobalIndex(photo))}
          >
            <img
              src={photo.src}
              alt=""
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        ))}
      </div>
    );
  }

  if (count === 4) {
    return (
      <div className="grid grid-cols-2 gap-1 max-w-[70%]">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="cursor-pointer overflow-hidden rounded-sm aspect-square"
            style={{ border: PIXEL_BORDER }}
            onClick={() => onOpen(getGlobalIndex(photo))}
          >
            <img
              src={photo.src}
              alt=""
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        ))}
      </div>
    );
  }

  // 3, 5-9 use a 3-column grid similar to WeChat Moments.
  return (
    <div className="grid grid-cols-3 gap-1 max-w-[70%]">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="cursor-pointer overflow-hidden rounded-sm aspect-square"
          style={{ border: PIXEL_BORDER }}
          onClick={() => onOpen(getGlobalIndex(photo))}
        >
          <img
            src={photo.src}
            alt=""
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      ))}
    </div>
  );
}
