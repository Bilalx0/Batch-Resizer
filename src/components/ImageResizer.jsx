import React, { useState, useCallback } from 'react';
import { Upload, Download, X, Loader2 } from 'lucide-react';

const ImageResizer = () => {
  const [images, setImages] = useState([]);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [preserveAspectRatio, setPreserveAspectRatio] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 30) {
      alert('Maximum 30 images allowed');
      return;
    }

    const newImages = imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      originalSize: file.size
    }));

    setImages(prev => [...prev, ...newImages].slice(0, 30));
  }, []);

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 30) {
      alert('Maximum 30 images allowed');
      return;
    }

    const newImages = imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      originalSize: file.size
    }));

    setImages(prev => [...prev, ...newImages].slice(0, 30));
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const resizeImage = async (image) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = image.preview;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let targetWidth = width;
        let targetHeight = height;
  
        if (preserveAspectRatio) {
          const originalAspectRatio = img.width / img.height;
          const targetAspectRatio = width / height;
          
          if (originalAspectRatio > targetAspectRatio) {
            targetWidth = width;
            targetHeight = width / originalAspectRatio;
          } else {
            targetHeight = height;
            targetWidth = height * originalAspectRatio;
          }
        }
  
        // Set canvas size to match the target dimensions
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
  
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        
        canvas.toBlob((blob) => {
          resolve({
            blob,
            name: image.name
          });
        }, 'image/jpeg', 0.85);
      };
    });
  };
  
  const processAndDownload = async () => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      const processedImages = [];
      for (let i = 0; i < images.length; i++) {
        const processed = await resizeImage(images[i]);
        processedImages.push(processed);
        setProgress(((i + 1) / images.length) * 100);
      }
      
      processedImages.forEach(({ blob, name }) => {
        zip.file(`resized-${name}`, blob);
      });
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resized-images.zip';
      a.click();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error processing images:', error);
      alert('Error processing images. Please try again.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className='flex justify-center px-4 text-emerald-800'>
        <h1 className="text-xl sm:text-2xl font-bold mb-4">Batch Image Resizer</h1>
        </div>
        
        
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6 cursor-pointer hover:border-emerald-500 transition-colors"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            id="file-input"
            onChange={handleFileInput}
          />
          <label htmlFor="file-input" className="cursor-pointer">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg mb-2">Drag & drop images here or click to browse</p>
            <p className="text-sm text-gray-500">Maximum 30 images allowed</p>
          </label>
        </div>

        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Width: {width}px</label>
            <input
              type="range"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              min="100"
              max="2000"
              step="50"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Height: {height}px</label>
            <input
              type="range"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              min="100"
              max="2000"
              step="50"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preserveAspectRatio}
              onChange={(e) => setPreserveAspectRatio(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span>Preserve aspect ratio</span>
          </label>
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image.preview}
                  alt={image.name}
                  className="w-full h-32 object-contain bg-gray-100 rounded-lg"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="text-xs mt-1 truncate">{image.name}</p>
              </div>
            ))}
          </div>
        )}

        {isProcessing && progress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div 
              className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        <button
          onClick={processAndDownload}
          disabled={images.length === 0 || isProcessing}
          className={`w-full py-2 px-4 rounded-lg flex items-center justify-center ${
            images.length === 0 || isProcessing
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-600'
          } text-white transition-colors`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing ({Math.round(progress)}%)
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download All Images
            </>
          )}
        </button>

        {images.length === 0 && (
          <div className="mt-4 p-4 bg-emerald-50 text-emerald-700 text-center rounded-lg">
            No images selected. Add some images to get started!
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageResizer;