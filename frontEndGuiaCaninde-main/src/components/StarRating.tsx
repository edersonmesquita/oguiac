import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

interface StarRatingProps {
  value: number;
  onChange?: (newRating: number) => void;
  isReadOnly?: boolean;
  size?: number;
}

export function StarRating({ value, onChange, isReadOnly = false, size = 20 }: StarRatingProps) {
  const stars = Array.from({ length: 5 }, (_, index) => index + 1);

  const handleStarClick = (starValue: number) => {
    if (!isReadOnly && onChange) {
      onChange(starValue);
    }
  };

  return (
    <div className="flex items-center">
      {stars.map((star) => {
        const isFilled = star <= value;
        return (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star)}
            disabled={isReadOnly}
            className={`${
              isReadOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            } transition-transform`}
            style={{ width: size, height: size }}
          >
            {isFilled ? (
              <StarIcon 
                className="text-yellow-400" 
                style={{ width: size, height: size }} 
              />
            ) : (
              <StarOutlineIcon 
                className="text-gray-300" 
                style={{ width: size, height: size }} 
              />
            )}
          </button>
        );
      })}
    </div>
  );
} 