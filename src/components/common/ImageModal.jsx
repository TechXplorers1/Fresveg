import React, { useState, useEffect } from 'react';
import { useImageModal } from '../../context/ImageModalContext';
import { X, ZoomIn, ZoomOut, RotateCw, Download, RotateCcw, Copy, Check, ChevronLeft, ChevronRight, Compass } from 'lucide-react';

const ImageModal = () => {
  const { modalData, closeImageModal, nextImage, prevImage, goToImage } = useImageModal();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [copied, setCopied] = useState(false);

  // Reset controls when modal opens/changes image
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setCopied(false);
  }, [modalData?.src]);

  // Keyboard shortcut listeners: Escape to close, ArrowLeft / ArrowRight to slide
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeImageModal();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      }
    };
    if (modalData) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [modalData, closeImageModal, nextImage, prevImage]);

  if (!modalData) return null;

  const hasMultiplePhotos = modalData.gallery && modalData.gallery.length > 1;
  const currentPhotoNum = (modalData.currentIndex ?? 0) + 1;
  const totalPhotos = modalData.gallery ? modalData.gallery.length : 1;

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = (e) => {
    e.stopPropagation();
    setZoom(1);
    setRotation(0);
  };

  const handleRotate = (e) => {
    e.stopPropagation();
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(modalData.src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = modalData.title 
        ? `${modalData.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.jpg`
        : 'farm-tour-photo.jpg';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      window.open(modalData.src, '_blank');
    }
  };

  const handleCopyLink = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(modalData.src);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      data-image-modal-root="true"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-between p-3 sm:p-5 bg-slate-950/90 backdrop-blur-lg animate-fadeIn transition-all duration-300 select-none"
      onClick={closeImageModal}
    >
      {/* Top Header Bar */}
      <div 
        className="w-full max-w-5xl flex items-center justify-between gap-3 py-2.5 px-4 sm:px-5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 text-white shadow-2xl z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          {hasMultiplePhotos ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-extrabold text-xs shrink-0 font-mono">
              <Compass size={14} className="animate-spin-slow text-emerald-400" />
              <span>{currentPhotoNum} / {totalPhotos}</span>
            </div>
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          )}

          <h3 className="font-semibold text-xs sm:text-sm text-white tracking-wide truncate">
            {modalData.title || 'Farm Tour Photo'}
          </h3>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-white"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-semibold tracking-wider transition-all text-emerald-300 flex items-center gap-1"
            title="Reset Zoom & Rotation"
          >
            <RotateCcw size={13} />
            <span>{Math.round(zoom * 100)}%</span>
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-white"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>

          <div className="w-px h-5 bg-white/20 mx-0.5" />

          <button
            type="button"
            onClick={handleRotate}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white"
            title="Rotate 90°"
          >
            <RotateCw size={16} />
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white"
            title="Copy Image URL"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white"
            title="Download Image"
          >
            <Download size={16} />
          </button>

          <div className="w-px h-5 bg-white/20 mx-0.5" />

          <button
            type="button"
            onClick={closeImageModal}
            className="p-2 rounded-xl bg-rose-500/80 hover:bg-rose-600 active:scale-95 transition-all text-white shadow-lg"
            title="Close Preview (ESC)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Stage & Previous / Next Arrow Overlay */}
      <div 
        className="flex-1 w-full relative flex items-center justify-center overflow-hidden my-2 cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Chevron Slide Arrow */}
        {hasMultiplePhotos && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-3 sm:p-4 rounded-2xl bg-black/50 hover:bg-emerald-600 text-white backdrop-blur-md border border-white/20 hover:border-emerald-400 shadow-2xl active:scale-90 transition-all group"
            title="Previous Photo (Left Arrow)"
          >
            <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Display Image */}
        <div 
          className="transition-transform duration-200 ease-out max-w-full max-h-full flex items-center justify-center"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`
          }}
        >
          <img
            src={modalData.src}
            alt={modalData.alt || modalData.title}
            className="max-h-[68vh] sm:max-h-[72vh] max-w-[85vw] object-contain rounded-2xl shadow-2xl border border-white/10 ring-1 ring-black/50"
            data-no-modal="true"
          />
        </div>

        {/* Right Chevron Slide Arrow */}
        {hasMultiplePhotos && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-3 sm:p-4 rounded-2xl bg-black/50 hover:bg-emerald-600 text-white backdrop-blur-md border border-white/20 hover:border-emerald-400 shadow-2xl active:scale-90 transition-all group"
            title="Next Photo (Right Arrow)"
          >
            <ChevronRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip & Navigation Bar for Visual Tour */}
      <div 
        className="w-full max-w-4xl flex flex-col items-center gap-2 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Interactive Filmstrip Thumbnails */}
        {hasMultiplePhotos && (
          <div className="flex items-center gap-2 overflow-x-auto max-w-full p-2 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 custom-scrollbar">
            {modalData.gallery.map((item, idx) => {
              const itemSrc = item.src || item.url;
              const isActive = idx === modalData.currentIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goToImage(idx)}
                  className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    isActive
                      ? 'border-emerald-400 ring-2 ring-emerald-500/50 scale-105 opacity-100 shadow-lg'
                      : 'border-transparent opacity-60 hover:opacity-100 hover:scale-100'
                  }`}
                  title={item.title || item.caption || `Photo ${idx + 1}`}
                >
                  <img
                    src={itemSrc}
                    alt={item.caption || `Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    data-no-modal="true"
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* Footer Hint Bar */}
        <div className="py-1 px-4 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-slate-300 text-[11px] tracking-wide shadow-md flex items-center gap-3">
          <span>Use <kbd className="px-1.5 py-0.5 rounded bg-white/20 text-white font-mono text-[10px]">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/20 text-white font-mono text-[10px]">→</kbd> arrow keys to navigate tour</span>
          <span className="text-white/30">•</span>
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/20 text-white font-mono text-[10px]">ESC</kbd> to exit</span>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
