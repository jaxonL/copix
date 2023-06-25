interface PixelProps {
  color: string;
  onClick: () => void;
}

const Pixel: React.FC<PixelProps> = ({ color, onClick }) => {
  return (
    // <HoverBubble content={`Color: ${color}`}>
    <div
      className="h-full w-full hover:scale-110 hover:cursor-pointer hover:drop-shadow-lg duration-100"
      style={{
        backgroundColor: color,

        borderRight: "1px solid #ccc", // Add border style for the right side of each cell
        borderBottom: "1px solid #ccc", // Add border style for the bottom side of each cell
      }}
      onClick={onClick}
    />
    // </HoverBubble>
  );
};
export default Pixel;
