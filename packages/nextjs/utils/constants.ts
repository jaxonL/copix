export const CONTRACT_NAME = "Copix";
export const PIXEL_UPDATE_EVENT = "PixelUpdate";

export enum Humanity {
  Unverified = 0,
  PhoneVerified = 1,
  OrbVerified = 2,
}

export function toHumanity(num: number): Humanity {
  switch (num) {
    case 0:
      return Humanity.Unverified;
    case 1:
      return Humanity.PhoneVerified;
    case 2:
      return Humanity.OrbVerified;
    default:
      throw new Error("Invalid humanity");
  }
}
