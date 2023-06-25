import React from "react";
import { ColorState, SliderPicker } from "react-color";

interface ColorPickerProps {
  color: string;
  setColor: (newColor: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, setColor }) => {
  const handleChange = (newColor: ColorState) => {
    setColor(newColor.hex);
  };

  return (
    <div>
      <div
        style={{ color: "white", backgroundColor: color, width: "auto", marginTop: "40px", marginBottom: "20px" }}
        className="rounded-lg text-center py-2"
      >
        <p>Color Preview</p>
      </div>
      <SliderPicker color={color} onChange={handleChange} />
    </div>
  );
};

export default ColorPicker;
