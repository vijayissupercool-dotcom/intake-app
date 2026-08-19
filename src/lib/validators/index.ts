import { z } from "zod";

export const createRequestSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .max(2000, "Description must be 2000 characters or less")
    .optional(),
  folderId: z.string().min(1, "Google Drive folder is required"),
  expiresAt: z.string().datetime().optional(),
  maxFiles: z
    .number()
    .int()
    .min(1, "Must allow at least 1 file")
    .max(100, "Maximum 100 files")
    .optional(),
  maxFileSizeMb: z
    .number()
    .int()
    .min(1, "Minimum file size is 1 MB")
    .max(100, "Maximum file size is 100 MB")
    .optional(),
  allowedFileTypes: z.array(z.string()).optional(),
  notifyEmail: z.boolean().optional(),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;

export const updateRequestSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .optional(),
  description: z
    .string()
    .max(2000, "Description must be 2000 characters or less")
    .optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  maxFiles: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .nullable(),
  maxFileSizeMb: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .nullable(),
  allowedFileTypes: z.array(z.string()).optional().nullable(),
  notifyEmail: z.boolean().optional(),
  active: z.boolean().optional(),
});

export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;

export const uploadMetadataSchema = z.object({
  requestId: z.string().uuid(),
  fileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  fileType: z.string().min(1),
  uploaderName: z.string().min(1).max(100).optional(),
  uploaderEmail: z.string().email().optional(),
});

export type UploadMetadataInput = z.infer<typeof uploadMetadataSchema>;
