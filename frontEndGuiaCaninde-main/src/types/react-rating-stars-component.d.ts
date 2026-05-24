declare module 'react-rating-stars-component' {
  interface ReactStarsProps {
    count?: number;
    value?: number;
    onChange?: (newRating: number) => void;
    size?: number;
    isHalf?: boolean;
    edit?: boolean;
    activeColor?: string;
    emptyIcon?: React.ReactNode;
    filledIcon?: React.ReactNode;
  }

  const ReactStars: React.FC<ReactStarsProps>;
  export default ReactStars;
} 