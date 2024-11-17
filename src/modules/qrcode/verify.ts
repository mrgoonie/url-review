import { Jimp } from "jimp";
import jsQR from "jsqr";

export async function verifyQRCode(buffer: Buffer, link: string) {
  try {
    const image = await Jimp.read(buffer);
    const { width, height, data } = image.bitmap;

    const code = jsQR(new Uint8ClampedArray(data.buffer), width, height);

    if (!code) {
      throw new Error("No QR code found in the image");
    }

    if (code.data !== link) {
      throw new Error("QR code content mismatch");
    }
  } catch (error) {
    throw new Error("QR code with icon is not scannable");
  }
}
