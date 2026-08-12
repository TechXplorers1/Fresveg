import React, { createContext, useContext, useState, useEffect } from 'react';

const ImageModalContext = createContext();

export const ImageModalProvider = ({ children }) => {
  const [modalData, setModalData] = useState(null);

  const openImageModal = ({
    src,
    alt = '',
    title = '',
    description = '',
    gallery = null,
    currentIndex = 0
  }) => {
    if (!src && (!gallery || gallery.length === 0)) return;

    let items = gallery;
    if (!items || items.length === 0) {
      items = [{ src, alt, title, description }];
    }

    const safeIndex = Math.max(0, Math.min(currentIndex, items.length - 1));
    const activeItem = items[safeIndex] || items[0];

    setModalData({
      src: activeItem.src || activeItem.url || src,
      alt: activeItem.alt || activeItem.caption || alt || 'Preview image',
      title: activeItem.title || activeItem.caption || title || activeItem.alt || 'Image Preview',
      description: activeItem.description || description || '',
      gallery: items,
      currentIndex: safeIndex
    });
  };

  const closeModal = () => {
    setModalData(null);
  };

  const nextImage = () => {
    setModalData((prev) => {
      if (!prev || !prev.gallery || prev.gallery.length <= 1) return prev;
      const nextIdx = (prev.currentIndex + 1) % prev.gallery.length;
      const activeItem = prev.gallery[nextIdx];
      return {
        ...prev,
        src: activeItem.src || activeItem.url,
        alt: activeItem.alt || activeItem.caption || 'Preview image',
        title: activeItem.title || activeItem.caption || activeItem.alt || 'Image Preview',
        description: activeItem.description || '',
        currentIndex: nextIdx
      };
    });
  };

  const prevImage = () => {
    setModalData((prev) => {
      if (!prev || !prev.gallery || prev.gallery.length <= 1) return prev;
      const prevIdx = (prev.currentIndex - 1 + prev.gallery.length) % prev.gallery.length;
      const activeItem = prev.gallery[prevIdx];
      return {
        ...prev,
        src: activeItem.src || activeItem.url,
        alt: activeItem.alt || activeItem.caption || 'Preview image',
        title: activeItem.title || activeItem.caption || activeItem.alt || 'Image Preview',
        description: activeItem.description || '',
        currentIndex: prevIdx
      };
    });
  };

  const goToImage = (index) => {
    setModalData((prev) => {
      if (!prev || !prev.gallery || index < 0 || index >= prev.gallery.length) return prev;
      const activeItem = prev.gallery[index];
      return {
        ...prev,
        src: activeItem.src || activeItem.url,
        alt: activeItem.alt || activeItem.caption || 'Preview image',
        title: activeItem.title || activeItem.caption || activeItem.alt || 'Image Preview',
        description: activeItem.description || '',
        currentIndex: index
      };
    });
  };

  // Delegated click listener to catch image clicks anywhere on the website automatically
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Don't intercept if click was inside an existing modal close button or control
      if (e.target.closest('[data-image-modal-root]') || e.target.closest('.no-image-modal')) {
        return;
      }

      // Check if target or parent is an image or requested preview
      let imgElement = null;
      if (e.target.tagName === 'IMG') {
        imgElement = e.target;
      } else if (e.target.dataset && e.target.dataset.previewSrc) {
        openImageModal({
          src: e.target.dataset.previewSrc,
          title: e.target.dataset.previewTitle || 'Image Preview',
          alt: e.target.dataset.previewAlt || ''
        });
        return;
      }

      if (imgElement) {
        // Skip if explicitly disabled (e.g., icons or small functional buttons with dataset.noModal)
        if (imgElement.dataset.noModal === 'true' || imgElement.classList.contains('no-modal')) {
          return;
        }

        const src = imgElement.currentSrc || imgElement.src;
        // Ignore inline SVGs, data URIs for tiny placeholders if any, or empty sources
        if (!src || src.startsWith('data:image/svg+xml')) return;

        const alt = imgElement.alt || '';
        const title = imgElement.title || alt || 'Image Preview';
        
        openImageModal({ src, alt, title });
      }
    };

    document.addEventListener('click', handleGlobalClick, true);
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, []);

  return (
    <ImageModalContext.Provider
      value={{
        modalData,
        openImageModal,
        closeImageModal: closeModal,
        nextImage,
        prevImage,
        goToImage
      }}
    >
      {children}
    </ImageModalContext.Provider>
  );
};

export const useImageModal = () => {
  const context = useContext(ImageModalContext);
  if (!context) {
    throw new Error('useImageModal must be used within an ImageModalProvider');
  }
  return context;
};
