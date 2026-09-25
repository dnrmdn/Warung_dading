'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Check, Loader2 } from 'lucide-react';
import { cropAndCompressToWebP } from '@/lib/image-compression';

interface ImageEditorModalProps {
  isOpen: boolean;
  file: File | null;
  onClose: () => void;
  onApply: (croppedBlob: Blob) => void;
}

export function ImageEditorModal({
  isOpen,
  file,
  onClose,
  onApply,
}: ImageEditorModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalDimensions, setNaturalDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Transform states: zoom and pan offset (relative to crop box center)
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  // References
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const offsetStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Load image when file changes
  useEffect(() => {
    if (!isOpen || !file) {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
        setImageSrc(null);
      }
      setNaturalDimensions(null);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setImageSrc(objectUrl);
    setZoom(1);
    setOffset({ x: 0, y: 0 });

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [isOpen, file]);

  const handleImageLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
  };

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Pointer event handlers for Pan/Drag
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isProcessing) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    offsetStartRef.current = { ...offset };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOffset({
      x: offsetStartRef.current.x + dx,
      y: offsetStartRef.current.y + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Pointer capture release safety
      }
    }
  };

  const handleApply = useCallback(async () => {
    if (!imageRef.current || !naturalDimensions || isProcessing) return;

    setIsProcessing(true);
    try {
      const img = imageRef.current;
      const cropBox = containerRef.current;
      if (!cropBox) return;

      const cropBoxRect = cropBox.getBoundingClientRect();
      const cropSize = cropBoxRect.width; // 1:1 square crop box in viewport px

      // Determine base scale of the image as rendered inside cropBox
      // In CSS, image has: object-fit: contain (or min-w/min-h)
      // We calculate how the displayed image maps to natural dimensions:
      const { width: natW, height: natH } = naturalDimensions;

      // Base displayed size before zoom (cover the crop box)
      const baseScale = Math.max(cropSize / natW, cropSize / natH);
      const renderedWidth = natW * baseScale * zoom;
      const renderedHeight = natH * baseScale * zoom;

      // The center of the crop box is at (cropSize / 2, cropSize / 2).
      // The center of the rendered image is at (cropSize / 2 + offset.x, cropSize / 2 + offset.y).
      // In rendered image coordinates, the top-left of the crop box is:
      const cropLeftInRendered = renderedWidth / 2 - offset.x - cropSize / 2;
      const cropTopInRendered = renderedHeight / 2 - offset.y - cropSize / 2;

      // Convert from rendered pixels back to source image natural coordinates:
      const scaleToNatural = natW / renderedWidth;
      const sx = Math.max(0, cropLeftInRendered * scaleToNatural);
      const sy = Math.max(0, cropTopInRendered * scaleToNatural);
      const sWidth = Math.min(natW - sx, cropSize * scaleToNatural);
      const sHeight = Math.min(natH - sy, cropSize * scaleToNatural);

      // Make sure crop box is square
      const sSize = Math.min(sWidth, sHeight);

      const croppedBlob = await cropAndCompressToWebP(img, {
        sx,
        sy,
        sWidth: sSize,
        sHeight: sSize,
      });

      onApply(croppedBlob);
    } catch (err) {
      console.error('Error during image crop & compress:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [naturalDimensions, zoom, offset, isProcessing, onApply]);

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background text-text select-none animate-in fade-in duration-200">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 h-14 border-b border-border/80 bg-surface/90 backdrop-blur z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-body font-semibold text-text">Edit Gambar Produk</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-surface-subtle transition-colors disabled:opacity-50"
          aria-label="Batal"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Viewport Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden bg-black/90">
        <p className="text-caption text-white/70 mb-3 text-center pointer-events-none">
          Geser untuk atur posisi • Gunakan slider untuk perbesar
        </p>

        {/* 1:1 Crop Frame Container */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden shadow-2xl border-2 border-primary ring-4 ring-black/50 cursor-grab active:cursor-grabbing touch-none select-none flex items-center justify-center bg-black/40"
        >
          {imageSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Source preview"
              onLoad={handleImageLoaded}
              draggable={false}
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                transition: isDraggingRef.current ? 'none' : 'transform 0.05s ease-out',
                maxWidth: 'none',
                maxHeight: 'none',
                minWidth: '100%',
                minHeight: '100%',
                objectFit: 'cover',
              }}
              className="pointer-events-none will-change-transform"
            />
          )}

          {/* Grid lines overlay for alignment */}
          <div className="absolute inset-0 pointer-events-none border border-white/20 grid grid-cols-3 grid-rows-3 opacity-40">
            <div className="border-r border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div className="border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div className="border-b border-white/20" />
            <div className="border-r border-white/20" />
            <div className="border-r border-white/20" />
            <div />
          </div>
        </div>
      </main>

      {/* Bottom Controls Bar */}
      <footer className="p-4 bg-surface border-t border-border shrink-0 flex flex-col gap-4">
        {/* Zoom Slider */}
        <div className="flex items-center gap-3 w-full max-w-sm mx-auto px-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, +(z - 0.2).toFixed(2)))}
            disabled={zoom <= 1 || isProcessing}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-surface-subtle disabled:opacity-40"
            aria-label="Perkecil"
          >
            <ZoomOut className="w-5 h-5" />
          </button>

          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            disabled={isProcessing}
            className="flex-1 h-2 bg-surface-subtle rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
            aria-label="Kontrol zoom"
          />

          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, +(z + 0.2).toFixed(2)))}
            disabled={zoom >= 3 || isProcessing}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-surface-subtle disabled:opacity-40"
            aria-label="Perbesar"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full max-w-sm mx-auto">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-2.5 px-4 rounded-xl border border-border text-text-secondary hover:bg-surface-subtle text-small font-medium transition-all disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={isProcessing || !naturalDimensions}
            className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-white font-semibold text-small hover:bg-primary-dark active:scale-98 transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Gunakan Gambar</span>
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
