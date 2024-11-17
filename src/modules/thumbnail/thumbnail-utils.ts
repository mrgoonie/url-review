import { env } from "@/env";

export function getTemplateUrl(template: string, imageUrl?: string) {
  return `${env.BASE_URL}/template/${template}?image_url=${imageUrl}`;
}
