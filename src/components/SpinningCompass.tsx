import { FC } from 'react';
import { Compass } from 'lucide-react';

interface SpinningCompassProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SpinningCompass: FC<SpinningCompassProps> = ({ size = 'lg', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  return (
    <div
      className={`inline-block ${className}`}
      style={{ background: 'none', border: 'none', boxShadow: 'none' }}
    >
      <Compass
        className={`${sizeClasses[size]} animate-spin`}
        style={{
          color: '#FF3366',
          animationDuration: '2s',
          animationTimingFunction: 'linear',
          background: 'none',
          border: 'none',
          boxShadow: 'none',
          fill: 'none',
          stroke: '#FF3366',
        }}
      />
      <style>{`
        .lucide-compass {
          background: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        .lucide-compass svg {
          background: none !important;
          border: none !important;
          box-shadow: none !important;
          fill: none !important;
        }
      `}</style>
    </div>
  );
};

export default SpinningCompass;
