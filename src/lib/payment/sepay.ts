import { env } from "@/env";

const SEPAY_QRCODE_BASE_URL = "https://qr.sepay.vn/img";

export function getSepayQRCodeImageUrl(data: {
  bill_id: string;
  /**
   * In VND
   */
  order_value?: number;
}) {
  /**
   * Cấu trúc link nhúng:
   * - SO_TAI_KHOAN (bắt buộc): Số tài khoản ngân hàng
   * - NGAN_HANG (bắt buộc): Tên của ngân hàng (bắt buộc). Danh sách tại đây.
   * - SO_TIEN (không bắt buộc): Số tiền chuyển khoản.
   * - NOI_DUNG (không bắt buộc): Nội dung chuyển khoản.
   *
   * Example:
   * `https://qr.sepay.vn/img?acc=0010000000355&bank=Vietcombank&amount=100000&des=ung%20ho%20quy%20bao%20tro%20tre%20em`
   *
   * Embed:
   * `<img src='https://qr.sepay.vn/img?acc=SO_TAI_KHOANH&bank=NGAN_HANG&amount=SO_TIEN&des=NOI_DUNG'/>`
   */
  const imageUrl = `${SEPAY_QRCODE_BASE_URL}?acc=${env.SEPAY_BANK_ID}&bank=${env.SEPAY_BANK}${
    data.order_value ? `&amount=${data.order_value}` : ""
  }&des=digicord%20${data.bill_id}%20vn%20`;

  return imageUrl;
}
