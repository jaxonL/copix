interface PixelProps {
  color: string;
  onClick: () => void;
}

const Pixel: React.FC<PixelProps> = ({ color, onClick }) => {
  return <div className={`h-5 w-5 bg-${color}`} onClick={onClick}></div>;
};
export default Pixel;
