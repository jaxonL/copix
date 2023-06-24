interface PixelProps {
  color: string;
  onClick: () => void;
}

const Pixel: React.FC<PixelProps> = ({ color, onClick }) => {
  return (
    <div
      className="h-full w-full"
      style={{
        backgroundColor: color,
      }}
      onClick={onClick}
    />
  );
};
export default Pixel;
