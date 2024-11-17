import { BlendMode, Jimp, JimpMime } from "jimp";
import QRCode from "qrcode";

import { env } from "@/env";
import { uploadFileBuffer } from "@/lib/cloud-storage";
import { prisma } from "@/lib/db";
import { getImageSizeByBuffer } from "@/lib/utils/image";

import { verifyQRCode } from "./verify";

export async function createQRCodeBase64(link: string) {
  const qrcode = await QRCode.toDataURL(link, {
    errorCorrectionLevel: "H",
    width: 1000,
    margin: 1,
  });
  return qrcode;
}

export async function createQRCodeBuffer(link: string) {
  const qrcode = await QRCode.toBuffer(link, {
    errorCorrectionLevel: "H",
    width: 1000,
    margin: 1,
  });
  return qrcode;
}

export async function createQRCodeSVG(link: string) {
  const qrcode = await QRCode.toString(link, {
    type: "svg",
    errorCorrectionLevel: "H",
    width: 1000,
    margin: 1,
  });
  return qrcode;
}

export async function createQRCodeWithIcon(
  link: string,
  iconBuffer: Buffer,
  size: number = 500,
  iconSizePercentage: number = 20
): Promise<Buffer> {
  // Create QR code
  const qrCodeBuffer = await QRCode.toBuffer(link, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: size,
  });

  // Load QR code image
  const qrImage = await Jimp.read(qrCodeBuffer);

  // Load and resize icon
  const iconImage = await Jimp.read(iconBuffer);
  const iconSize = Math.min(Math.round((size * iconSizePercentage) / 100), size / 4);
  iconImage.resize({ w: iconSize, h: iconSize });

  // Calculate position to center the icon
  const iconX = (size - iconSize) / 2;
  const iconY = (size - iconSize) / 2;

  // Composite icon onto QR code
  qrImage.composite(iconImage, iconX, iconY, {
    mode: BlendMode.SRC_OVER,
    opacitySource: 1,
    opacityDest: 1,
  });

  // Convert to buffer
  const buffer = await qrImage.getBuffer(JimpMime.png);

  // Verify QR code is still scannable
  try {
    await verifyQRCode(buffer, link);
  } catch (error) {
    throw new Error("QR code with icon is not scannable");
  }

  return buffer;
}

export async function createQRCode(
  destinationUrl: string,
  options?: {
    skipRedirection?: boolean;
    iconBase64?: string;
    iconUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    bgColor?: string;
  },
  ownership?: { userId?: string; workspaceId?: string }
) {
  // create qrCode in database
  const qrCode = await prisma.qrCode.create({
    data: {
      destinationUrl,
      ...ownership,
    },
  });

  const { skipRedirection, ...restOptions } = options || {};

  // link of qrcode
  const qrCodeLink = skipRedirection ? destinationUrl : `${env.BASE_URL}/qr/${qrCode.id}`;

  // create qrcode variants
  const [base64, buffer, svg] = await Promise.all([
    createQRCodeBase64(qrCodeLink),
    createQRCodeBuffer(qrCodeLink),
    createQRCodeSVG(qrCodeLink),
  ]);

  // get image size
  const imageSize = await getImageSizeByBuffer(buffer);

  // upload to cloudflare r2
  const svgBuffer = Buffer.from(svg, "utf-8");
  const [imageUrl, svgUrl] = await Promise.all([
    uploadFileBuffer(buffer, "qrcode.png", { contentType: "image/png" }),
    uploadFileBuffer(svgBuffer, "qrcode.svg", { contentType: "image/svg+xml" }),
  ]);

  // save to db
  const updatedQrCode = await prisma.qrCode.update({
    where: {
      id: qrCode.id,
    },
    data: {
      imageUrl: imageUrl.publicUrl,
      imageBase64: base64,
      imageSvg: svg,
      imageSvgUrl: svgUrl.publicUrl,
      width: imageSize.width,
      height: imageSize.height,
      ...restOptions,
    },
  });
  return updatedQrCode;
}
