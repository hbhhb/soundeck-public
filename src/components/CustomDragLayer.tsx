import React from 'react';
import { useDragLayer } from 'react-dnd';
import { SoundCard } from './SoundCard';
import { Sound } from './SoundboardApp';

const layerStyles: React.CSSProperties = {
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: 100,
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
};

function getItemStyles(
  currentOffset: { x: number; y: number } | null,
) {
  if (!currentOffset) {
    return {
      display: 'none',
    };
  }

  const { x, y } = currentOffset;

  // Center the card horizontally and offset vertically for comfortable dragging
  const transform = `translate(${x}px, ${y}px)`;
  return {
    transform,
    WebkitTransform: transform,
  };
}

interface CustomDragLayerProps {
  sounds: Sound[];
  masterVolume?: number;
}

export const CustomDragLayer: React.FC<CustomDragLayerProps> = ({ sounds, masterVolume }) => {
  const { itemType, isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    currentOffset: monitor.getClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  if (!isDragging) {
    return null;
  }

  const sound = sounds.find((s) => s.id === item?.id);

  if (!sound) {
    return null;
  }

  return (
    <div style={layerStyles}>
      <div style={getItemStyles(currentOffset)}>
        <div 
          style={{ 
            width: item?.width || 320,
            height: item?.height || 'auto',
            opacity: 0.95,
            transform: 'rotate(3deg) scale(1.05)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
          }}
        >
          <SoundCard 
            sound={sound} 
            masterVolume={masterVolume}
            onDelete={() => {}}
            isDragging={true}
          />
        </div>
      </div>
    </div>
  );
};