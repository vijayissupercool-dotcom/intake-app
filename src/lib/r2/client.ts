import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/config/env";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: env.r2.endpoint,
  credentials: {
    accessKeyId: env.r2.accessKeyId,
    secretAccessKey: env.r2.secretAccessKey,
  },
});

export interface PresignedUrlOptions {
  key: string;
  contentType: string;
  expiresIn?: number; // seconds, default 900 (15 min)
}

export async function getPresignedUploadUrl({
  key,
  contentType,
  expiresIn = 900,
}: PresignedUrlOptions) {
  const command = new PutObjectCommand({
    Bucket: env.r2.bucketName,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(r2Client, command, { expiresIn });
  return url;
}

export async function getPresignedDownloadUrl(key: string, expiresIn = 900) {
  const command = new GetObjectCommand({
    Bucket: env.r2.bucketName,
    Key: key,
  });

  const url = await getSignedUrl(r2Client, command, { expiresIn });
  return url;
}

export async function deleteObject(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: env.r2.bucketName,
    Key: key,
  });

  await r2Client.send(command);
}

export async function headObject(key: string) {
  const command = new HeadObjectCommand({
    Bucket: env.r2.bucketName,
    Key: key,
  });

  return r2Client.send(command);
}

export async function downloadFileFromR2(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: env.r2.bucketName,
    Key: key,
  });

  const response = await r2Client.send(command);
  const chunks: Uint8Array[] = [];

  if (response.Body) {
    const reader = response.Body.transformToWebStream().getReader();
    let done = false;
    while (!done) {
      const result = await reader.read();
      done = result.done;
      if (result.value) {
        chunks.push(result.value);
      }
    }
  }

  return Buffer.concat(chunks);
}

export async function downloadFileStream(key: string) {
  const command = new GetObjectCommand({
    Bucket: env.r2.bucketName,
    Key: key,
  });

  const response = await r2Client.send(command);

  if (!response.Body) {
    throw new Error("R2 object has no body");
  }

  return {
    stream: response.Body.transformToWebStream(),
    contentLength: response.ContentLength,
    contentType: response.ContentType,
  };
}
