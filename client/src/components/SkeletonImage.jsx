import React, { useEffect, useState } from 'react';

const SkeletonImage = ({
    src,
    alt,
    fallbackSrc,
    wrapperClassName = '',
    className = '',
    skeletonClassName = '',
    loading = 'lazy',
    decoding = 'async',
    onLoad,
    onError,
    ...rest
}) => {
    const [currentSrc, setCurrentSrc] = useState(src);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasFailed, setHasFailed] = useState(false);

    useEffect(() => {
        setCurrentSrc(src);
        setIsLoaded(false);
        setHasFailed(false);
    }, [src]);

    const handleLoad = (event) => {
        setIsLoaded(true);
        if (typeof onLoad === 'function') {
            onLoad(event);
        }
    };

    const handleError = (event) => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
            setCurrentSrc(fallbackSrc);
            return;
        }

        setHasFailed(true);
        setIsLoaded(true);
        if (typeof onError === 'function') {
            onError(event);
        }
    };

    return (
        <div className={`relative overflow-hidden ${wrapperClassName}`}>
            {!isLoaded && (
                <div
                    className={`absolute inset-0 animate-pulse bg-black/10 dark:bg-white/10 ${skeletonClassName}`}
                    aria-hidden="true"
                />
            )}
            {hasFailed && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40">No Image</span>
                </div>
            )}
            <img
                src={currentSrc}
                alt={alt}
                loading={loading}
                decoding={decoding}
                onLoad={handleLoad}
                onError={handleError}
                className={`transition-opacity duration-300 ${hasFailed ? 'hidden' : ''} ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
                {...rest}
            />
        </div>
    );
};

export default SkeletonImage;
