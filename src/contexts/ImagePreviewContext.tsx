import { createContext, useContext, useState, type ReactNode } from 'react';

interface ImagePreviewContextType {
  isPreviewOpen: boolean;
  setIsPreviewOpen: (open: boolean) => void;
}

const ImagePreviewContext = createContext<ImagePreviewContextType | undefined>(undefined);

export function ImagePreviewProvider({ children }: { children: ReactNode }) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <ImagePreviewContext.Provider value={{ isPreviewOpen, setIsPreviewOpen }}>
      {children}
    </ImagePreviewContext.Provider>
  );
}

export function useImagePreview() {
  const context = useContext(ImagePreviewContext);
  if (context === undefined) {
    throw new Error('useImagePreview must be used within an ImagePreviewProvider');
  }
  return context;
}
