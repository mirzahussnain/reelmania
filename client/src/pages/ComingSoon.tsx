import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/components/ui/Button';

const ComingSoon: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center text-on-surface p-6">
      <h1 className="text-4xl font-syne font-bold mb-4 text-primary drop-shadow-[0_0_15px_var(--color-primary)]">Coming Soon</h1>
      <p className="text-lg font-inter text-on-surface-variant mb-8 w-[90%] max-w-[450px]">
        We are actively engineering this feature to bring you the best cinematic experience. Stay tuned!
      </p>
      <Button
        variant="unstyled"
        onClick={() => navigate(-1)}
        className="px-6 py-3 rounded-full bg-surface-container border border-outline-variant/20 hover:bg-surface-container-high transition-colors font-semibold"
      >
        Go Back
      </Button>
    </div>
  );
};

export default ComingSoon;
