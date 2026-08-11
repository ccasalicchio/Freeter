import { Button, ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import styles from './widget.module.scss';
import { Settings } from './settings';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createActionBarItems } from '@/widgets/image-media/actionBar';
import { createContextMenuFactory } from '@/widgets/image-media/contextMenu';
import { openInViewerSvg, prevImageSvg, nextImageSvg, slideshowPlaySvg, slideshowPauseSvg } from '@/widgets/image-media/icons';

function pathToFileUrl(path: string): string {
  if (!path) {
    return '';
  }
  return `file://${encodeURI(path)}`;
}

function WidgetComp({widgetApi, settings}: WidgetReactComponentProps<Settings>) {
  const {updateActionBar, setContextMenuFactory} = widgetApi;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideshowRunning, setSlideshowRunning] = useState(false);
  const [imageFiles, setImageFiles] = useState<string[]>([]);
  const slideshowTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {imagePath, fitMode, slideshowEnabled, slideshowFolder, slideshowIntervalSec} = settings;

  const currentImagePath = useMemo(() => {
    if (slideshowEnabled && imageFiles.length > 0) {
      return imageFiles[currentIndex];
    }
    return imagePath;
  }, [slideshowEnabled, imageFiles, currentIndex, imagePath]);

  const fileUrl = useMemo(() => pathToFileUrl(currentImagePath), [currentImagePath]);

  useEffect(() => {
    if (slideshowEnabled && slideshowFolder) {
      setImageFiles([slideshowFolder]);
    } else {
      setImageFiles([]);
    }
    setCurrentIndex(0);
    setSlideshowRunning(false);
  }, [slideshowEnabled, slideshowFolder]);

  useEffect(() => {
    if (slideshowRunning && imageFiles.length > 1) {
      slideshowTimerRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % imageFiles.length);
      }, slideshowIntervalSec * 1000);
    }
    return () => {
      if (slideshowTimerRef.current) {
        clearInterval(slideshowTimerRef.current);
        slideshowTimerRef.current = null;
      }
    };
  }, [slideshowRunning, imageFiles.length, slideshowIntervalSec]);

  useEffect(() => {
    updateActionBar(createActionBarItems(currentImagePath, widgetApi));
    setContextMenuFactory(createContextMenuFactory(currentImagePath, widgetApi));
  }, [currentImagePath, updateActionBar, setContextMenuFactory, widgetApi]);

  const openViewer = useCallback(() => {
    if (currentImagePath) {
      widgetApi.shell.openPath(currentImagePath);
    }
  }, [currentImagePath, widgetApi]);

  const goPrev = useCallback(() => {
    if (imageFiles.length > 0) {
      setCurrentIndex(prev => (prev - 1 + imageFiles.length) % imageFiles.length);
    }
  }, [imageFiles.length]);

  const goNext = useCallback(() => {
    if (imageFiles.length > 0) {
      setCurrentIndex(prev => (prev + 1) % imageFiles.length);
    }
  }, [imageFiles.length]);

  const toggleSlideshow = useCallback(() => {
    setSlideshowRunning(prev => !prev);
  }, []);

  if (!currentImagePath) {
    return <div className={styles['not-configured']}>Image path not specified</div>;
  }

  return (
    <div className={styles['img-media-viewport']}>
      <div className={styles['img-media-container']}>
        {fileUrl && (
          <img
            className={styles[`fit-${fitMode}`]}
            src={fileUrl}
            alt={currentImagePath}
            onClick={openViewer}
            title="Click to open in viewer"
          />
        )}
      </div>
      {slideshowEnabled && imageFiles.length > 1 && (
        <div className={styles['slideshow-controls']}>
          <Button
            onClick={goPrev}
            iconSvg={prevImageSvg}
            title="Previous"
            size="S"
          />
          <Button
            onClick={toggleSlideshow}
            iconSvg={slideshowRunning ? slideshowPauseSvg : slideshowPlaySvg}
            title={slideshowRunning ? 'Pause' : 'Play'}
            size="S"
          />
          <div className={styles['slideshow-counter']}>
            {currentIndex + 1} / {imageFiles.length}
          </div>
          <Button
            onClick={goNext}
            iconSvg={nextImageSvg}
            title="Next"
            size="S"
          />
          <Button
            onClick={openViewer}
            iconSvg={openInViewerSvg}
            title="Open in Viewer"
            size="S"
          />
        </div>
      )}
    </div>
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
