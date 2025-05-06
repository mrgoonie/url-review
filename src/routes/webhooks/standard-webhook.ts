import crypto from "crypto";

const WEBHOOK_TOLERANCE_IN_SECONDS = 5 * 60; // 5 minutes

// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// https://github.com/denoland/deno_std/blob/main/crypto/timing_safe_equal.ts

/** Make an assertion, if not `true`, then throw. */
function assert(expr: unknown, msg = ""): asserts expr {
  if (!expr) {
    throw new Error(msg);
  }
}

/** Compare two array buffers or data views in a way that timing based attacks
 * cannot gain information about the platform. */
export function timingSafeEqual(
  a: ArrayBufferView | ArrayBufferLike | DataView,
  b: ArrayBufferView | ArrayBufferLike | DataView
): boolean {
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  if (!(a instanceof DataView)) {
    a = new DataView(ArrayBuffer.isView(a) ? a.buffer : a);
  }
  if (!(b instanceof DataView)) {
    b = new DataView(ArrayBuffer.isView(b) ? b.buffer : b);
  }
  assert(a instanceof DataView);
  assert(b instanceof DataView);
  const length = a.byteLength;
  let out = 0;
  let i = -1;
  while (++i < length) {
    out |= a.getUint8(i) ^ b.getUint8(i);
  }
  return out === 0;
}

class ExtendableError extends Error {
  constructor(message: any) {
    super(message);
    Object.setPrototypeOf(this, ExtendableError.prototype);
    this.name = "ExtendableError";
    this.stack = new Error(message).stack;
  }
}

export class WebhookVerificationError extends ExtendableError {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, WebhookVerificationError.prototype);
    this.name = "WebhookVerificationError";
  }
}

export interface WebhookUnbrandedRequiredHeaders {
  "webhook-id": string;
  "webhook-timestamp": string;
  "webhook-signature": string;
}

export interface WebhookOptions {
  format?: "raw";
}

export class Webhook {
  private static prefix = "whsec_";
  private readonly key: Uint8Array;

  constructor(secret: string, options?: WebhookOptions) {
    // if (!secret) {
    //   throw new Error("Secret can't be empty.");
    // }
    // if (options?.format === "raw") {
    //   if (secret instanceof Uint8Array) {
    //     this.key = secret;
    //   } else {
    //     this.key = Uint8Array.from(secret, (c) => c.charCodeAt(0));
    //   }
    // } else {
    //   if (typeof secret !== "string") {
    //     throw new Error("Expected secret to be of type string");
    //   }
    //   if (secret.startsWith(Webhook.prefix)) {
    //     secret = secret.substring(Webhook.prefix.length);
    //   }
    //   this.key = base64.decode(secret);
    // }

    if (!secret) {
      throw new Error("Secret can't be empty.");
    }
    this.key = Buffer.from(secret, "utf-8");
  }

  public verify(
    payload: string | Buffer,
    headers_: WebhookUnbrandedRequiredHeaders | Record<string, string>
  ): unknown {
    const headers: Record<string, string> = {};
    for (const key of Object.keys(headers_)) {
      headers[key.toLowerCase()] = (headers_ as Record<string, string>)[key];
    }

    const msgId = headers["webhook-id"];
    const msgSignature = headers["webhook-signature"];
    const msgTimestamp = headers["webhook-timestamp"];

    if (!msgSignature || !msgId || !msgTimestamp) {
      throw new WebhookVerificationError("Missing required headers");
    }

    const timestamp = this.verifyTimestamp(msgTimestamp);
    // console.log("Verifying with timestamp:", timestamp.toISOString());

    const computedSignature = this.sign(msgId, timestamp, payload);
    // console.log("Computed signature in verify:", computedSignature);
    // console.log("Received signature:", msgSignature);

    if (computedSignature !== msgSignature) {
      throw new WebhookVerificationError("No matching signature found");
    }
    return JSON.parse(Buffer.isBuffer(payload) ? payload.toString("utf-8") : payload);

    /**
     * StandardWebhook:
     */
    // const computedSignature = this.sign(msgId, timestamp, payload);
    // const expectedSignature = computedSignature.split(",")[1];
    // const passedSignatures = msgSignature.split(" ");
    // const encoder = new globalThis.TextEncoder();
    // for (const versionedSignature of passedSignatures) {
    //   const [version, signature] = versionedSignature.split(",");
    //   if (version !== "v1") {
    //     continue;
    //   }
    //   if (timingSafeEqual(encoder.encode(signature), encoder.encode(expectedSignature))) {
    //     return JSON.parse(payload.toString());
    //   }
    // }
    // throw new WebhookVerificationError("No matching signature found");
  }

  public sign(msgId: string, timestamp: Date, payload: string | Buffer): string {
    if (typeof payload === "string") {
      // Do nothing, already a string
    } else if (payload.constructor.name === "Buffer") {
      payload = payload.toString();
    } else {
      throw new Error("Expected payload to be of type string or Buffer.");
    }

    /**
     * StandardWebhook:
     * USING "fast-sha256"
     */
    // const encoder = new TextEncoder();
    // const timestampNumber = Math.floor(timestamp.getTime() / 1000);
    // const toSign = encoder.encode(`${msgId}.${timestampNumber}.${payload}`);
    // const expectedSignature = base64.encode(sha256.hmac(this.key, toSign));
    // return `v1,${expectedSignature}`;

    /**
     * USING "crypto"
     */
    const timestampNumber = Math.floor(timestamp.getTime() / 1000);
    const toSign = `${msgId}.${timestampNumber}.${payload}`;

    const hmac = crypto.createHmac("sha256", this.key);
    hmac.update(toSign);
    const signature = hmac.digest("base64");

    return `v1,${signature}`;
  }

  private verifyTimestamp(timestampHeader: string): Date {
    const now = Math.floor(Date.now() / 1000);
    const timestamp = parseInt(timestampHeader, 10);
    if (isNaN(timestamp)) {
      throw new WebhookVerificationError("Invalid Signature Headers");
    }

    if (now - timestamp > WEBHOOK_TOLERANCE_IN_SECONDS) {
      throw new WebhookVerificationError("Message timestamp too old");
    }
    if (timestamp > now + WEBHOOK_TOLERANCE_IN_SECONDS) {
      throw new WebhookVerificationError("Message timestamp too new");
    }
    return new Date(timestamp * 1000);
  }
}
