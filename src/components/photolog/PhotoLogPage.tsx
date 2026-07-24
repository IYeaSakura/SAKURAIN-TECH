'use client';

/**
 * Photo log page —— a chronological gallery of moments worth capturing.
 *
 * Rendered with the site-wide brutalist design: sharp corners, thick borders,
 * pixel offset shadows and monospace metadata labels.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, MapPin, Calendar, Tag, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAnimationEnabled, useNavigation } from '@/hooks';
import type { PhotoLogData, PhotoLogPhoto } from '@/types';

const PIXEL_BORDER = '2px solid var(--border-subtle)';
const PIXEL_SHADOW = '4px 4px 0 var(--border-subtle)';

export function PhotoLogPage() {
  const animationEnabled = useAnimationEnabled();
  const { navigateTo } = useNavigation();
  const [data, setData] = useState<PhotoLogData | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch('/data/photolog.json')
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const photos = data?.photos ?? [];

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const prevPhoto = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length);
  };

  const nextPhoto = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % photos.length);
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
  }, [lightboxIndex, photos.length]);

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24 lg:py-28">
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
            返回首页
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

        {/* Photo grid */}
        {photos.length === 0 ? (
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
            暂无照片
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                index={index}
                animationEnabled={animationEnabled}
                onOpen={() => openLightbox(index)}
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
              aria-label="关闭"
            >
              <X className="w-5 h-5" />
            </button>

            {photos.length > 1 && (
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
                  aria-label="上一张"
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
                  aria-label="下一张"
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
                src={photos[lightboxIndex].src}
                alt={photos[lightboxIndex].caption}
                className="w-full max-h-[80vh] object-contain border-2"
                style={{ borderColor: 'var(--border-subtle)' }}
              />
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{photos[lightboxIndex].caption}</span>
                <span className="inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  <Calendar className="w-3 h-3" />
                  {photos[lightboxIndex].date}
                </span>
                <span className="inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  <MapPin className="w-3 h-3" />
                  {photos[lightboxIndex].location}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PhotoCard({
  photo,
  index,
  animationEnabled,
  onOpen,
}: {
  photo: PhotoLogPhoto;
  index: number;
  animationEnabled: boolean;
  onOpen: () => void;
}) {
  return (
    <motion.article
      initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: (index % 6) * 0.05 }}
      className="group cursor-pointer"
      onClick={onOpen}
    >
      <div
        className="overflow-hidden rounded-sm transition-transform duration-200 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5"
        style={{
          background: 'var(--bg-secondary)',
          border: PIXEL_BORDER,
          boxShadow: PIXEL_SHADOW,
        }}
      >
        <div className="aspect-[4/3] overflow-hidden border-b-2" style={{ borderColor: 'var(--border-subtle)' }}>
          <img
            src={photo.src}
            alt={photo.caption}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="p-4">
          <p className="text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
            {photo.caption}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {photo.date}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {photo.location}
            </span>
          </div>
          {photo.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {photo.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase border"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
