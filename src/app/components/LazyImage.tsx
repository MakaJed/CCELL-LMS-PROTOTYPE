import { useState } from 'react';
import { cn } from './ui/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
}

/**
 * LazyImage component with loading placeholder
 * Automatically lazy loads images and shows a skeleton while loading
 *
 * @example
 * <LazyImage
 *   src={course.image}
 *   alt={course.title}
 *   className="w-full h-48 object-cover"
 * />
 */
export function LazyImage({
  src,
  alt,
  className,
  placeholderClassName,
  ...props
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="relative overflow-hidden">
      {/* Skeleton placeholder */}
      {!loaded && !error && (
        <div
          className={cn(
            'absolute inset-0 bg-gray-200 animate-pulse',
            placeholderClassName
          )}
          aria-hidden="true"
        />
      )}

      {/* Actual image */}
      {!error && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={cn(
            'transition-opacity duration-300',
            loaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          {...props}
        />
      )}

      {/* Error fallback */}
      {error && (
        <div
          className={cn(
            'flex items-center justify-center bg-gray-100',
            className
          )}
        >
          <div className="text-center text-gray-400 p-4">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs">Image unavailable</p>
          </div>
        </div>
      )}
    </div>
  );
}
