import aiIconSrc from "@/assets/ai-icon.png";

interface AiIconProps {
  size?: number;
  className?: string;
}

const AiIcon = ({ size = 16, className = "" }: AiIconProps) => (
  <img src={aiIconSrc} alt="AI" width={size} height={size} className={`inline-block ${className}`} />
);

export default AiIcon;
