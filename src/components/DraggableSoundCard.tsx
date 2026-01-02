import React, { useRef, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { SoundCard } from './SoundCard';
import { Sound } from '../types';
import { motion } from 'framer-motion';
import { logAnalyticsEvent } from '../utils/analytics';

interface DraggableSoundCardProps {
  sound: Sound;
  index: number;
  masterVolume?: number;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
  onDelete: () => void;
  onVolumeChange?: (volume: number) => void;
  onEdit?: (updates: Partial<Sound>) => void;
  allSounds?: Sound[]; // For duplicate hotkey checking
}

export const ItemTypes = {
  CARD: 'card',
};

interface DragItem {
  index: number;
  id: string;
  type: string;
}

export const DraggableSoundCard: React.FC<DraggableSoundCardProps> = ({
  sound,
  index,
  masterVolume,
  moveCard,
  onDelete,
  onVolumeChange,
  onEdit,
  allSounds
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: ItemTypes.CARD,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical and horizontal middle points
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
        return;
      }

      // Get pixels from the top and left
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;

      // Calculate how far the cursor is from the center (normalized 0-1)
      const verticalDistance = Math.abs(hoverClientY - hoverMiddleY) / hoverMiddleY;
      const horizontalDistance = Math.abs(hoverClientX - hoverMiddleX) / hoverMiddleX;

      // Determine if moving forward (down/right) or backward (up/left)
      const isMovingForward = dragIndex < hoverIndex;
      const isMovingBackward = dragIndex > hoverIndex;

      // Check if cursor crossed the threshold on either axis
      // Using a lower threshold (0.3) makes it more responsive
      const threshold = 0.3;

      if (isMovingForward) {
        // When dragging forward, check if cursor is past threshold on either axis
        const passedVertical = hoverClientY > hoverMiddleY * (1 + threshold);
        const passedHorizontal = hoverClientX > hoverMiddleX * (1 + threshold);

        if (!passedVertical && !passedHorizontal) {
          return;
        }
      }

      if (isMovingBackward) {
        // When dragging backward, check if cursor is before threshold on either axis
        const passedVertical = hoverClientY < hoverMiddleY * (1 - threshold);
        const passedHorizontal = hoverClientX < hoverMiddleX * (1 - threshold);

        if (!passedVertical && !passedHorizontal) {
          return;
        }
      }

      // Time to actually perform the action
      moveCard(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.CARD,
    item: () => {
      // Capture the actual card dimensions at drag start
      const rect = ref.current?.getBoundingClientRect();
      return {
        id: sound.id,
        index,
        width: rect?.width || 320,
        height: rect?.height || 200,
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      if (monitor.didDrop()) {
        const dropResult = monitor.getDropResult();
        // Log reorder event
        logAnalyticsEvent({
          name: 'event_reorder_sound',
          params: { sound_id: sound.id }
        });
      }
    },
  });

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  drag(drop(ref));

  return (
    <motion.div
      ref={ref}
      layout
      layoutId={sound.id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: isDragging ? 0 : 1,
        scale: 1,
      }}
      transition={{
        layout: {
          type: 'spring',
          stiffness: 300,
          damping: 30,
        },
        default: {
          duration: 0.2,
          ease: 'easeInOut',
        },
      }}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        visibility: isDragging ? 'hidden' : 'visible',
      }}
      data-handler-id={handlerId}
    >
      <SoundCard
        sound={sound}
        masterVolume={masterVolume}
        onDelete={onDelete}
        onVolumeChange={onVolumeChange}
        onEdit={onEdit}
        allSounds={allSounds}
      />
    </motion.div>
  );
};