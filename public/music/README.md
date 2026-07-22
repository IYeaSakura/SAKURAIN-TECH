# Music Assets

This directory stores background music files used by the [`MusicPlayer`](../../src/components/MusicPlayer/index.tsx) component.

## Usage

1. Place audio files (`.mp3`, `.wav`, `.ogg`, or any browser-supported format) in this directory.
2. Update the playlist in [`src/components/MusicPlayer/index.tsx`](../../src/components/MusicPlayer/index.tsx).
3. Reference tracks using absolute paths under `/music/`.

## Example Playlist Entry

```typescript
export const PLAYLIST = [
  {
    id: '1',
    title: 'Song Title',
    artist: 'Artist Name',
    src: '/music/your-song.mp3',
    cover: '/music/your-cover.jpg',
  },
];
```

## Guidelines

- Use ASCII filenames to avoid encoding issues on some servers.
- Cover images should be square and at least 300x300 pixels.
- Audio files are served as static assets and copied to the build output automatically.
- Large files should be kept under version control only if necessary; consider a CDN for files over 10MB.
