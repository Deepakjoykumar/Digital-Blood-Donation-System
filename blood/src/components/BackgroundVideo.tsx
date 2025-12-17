import React from "react";

interface BackgroundVideoProps {
  src: string;
  overlay?: boolean;
}

const BackgroundVideo: React.FC<BackgroundVideoProps> = ({ src, overlay = true }) => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {overlay && <div className="absolute inset-0 bg-black/60" />}
    </div>
  );
};

export default BackgroundVideo;
