'use client';
import { useState, useEffect } from 'react';

interface FileDocument {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType?: string;
}

interface FilePreviewModalProps {
  files: FileDocument[];
  initialIndex: number;
  onClose: () => void;
}

export default function FilePreviewModal({ files, initialIndex, onClose }: FilePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentFile = files[currentIndex];
  const baseUrl = 'http://localhost:3006';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < files.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const isImage = (fileName: string) => /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName);
  const isPDF = (fileName: string) => /\.pdf$/i.test(fileName);

  return (
    <div className="fixed inset-0 bg-black/80 z-[99999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white">{currentFile.fileName}</h3>
            <p className="text-sm text-gray-500">{(currentFile.fileSize / 1024).toFixed(2)} KB • {currentIndex + 1} / {files.length}</p>
          </div>
          <div className="flex items-center gap-2">
            <a href={`${baseUrl}/${currentFile.filePath}`} download className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              ดาวน์โหลด
            </a>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="relative h-[calc(90vh-80px)]">
          <div className="h-full overflow-auto bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
            {isImage(currentFile.fileName) ? (
              <img src={`${baseUrl}/${currentFile.filePath}`} alt={currentFile.fileName} className="max-w-full max-h-full object-contain" />
            ) : isPDF(currentFile.fileName) ? (
              <iframe src={`${baseUrl}/${currentFile.filePath}`} className="w-full h-full" />
            ) : (
              <div className="text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p>ไม่สามารถแสดงตัวอย่างไฟล์นี้ได้</p>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          {currentIndex > 0 && (
            <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2 shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {currentIndex < files.length - 1 && (
            <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2 shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
