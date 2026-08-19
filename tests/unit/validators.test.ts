import { describe, it, expect } from "vitest";
import {
  createRequestSchema,
  updateRequestSchema,
  uploadMetadataSchema,
} from "@/lib/validators";

describe("createRequestSchema", () => {
  const validInput = {
    title: "Website Redesign",
    folderId: "folder-123",
  };

  it("accepts valid minimal input", () => {
    const result = createRequestSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts valid full input", () => {
    const result = createRequestSchema.safeParse({
      ...validInput,
      description: "Upload your assets",
      expiresAt: "2026-12-31T23:59:59Z",
      maxFiles: 5,
      maxFileSizeMb: 25,
      allowedFileTypes: ["image/png", "application/pdf"],
      notifyEmail: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = createRequestSchema.safeParse({ folderId: "f" });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = createRequestSchema.safeParse({ title: "", folderId: "f" });
    expect(result.success).toBe(false);
  });

  it("rejects title over 200 characters", () => {
    const result = createRequestSchema.safeParse({
      title: "a".repeat(201),
      folderId: "f",
    });
    expect(result.success).toBe(false);
  });

  it("accepts title at exactly 200 characters", () => {
    const result = createRequestSchema.safeParse({
      title: "a".repeat(200),
      folderId: "f",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing folderId", () => {
    const result = createRequestSchema.safeParse({ title: "Test" });
    expect(result.success).toBe(false);
  });

  it("rejects empty folderId", () => {
    const result = createRequestSchema.safeParse({
      title: "Test",
      folderId: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects maxFiles at 0", () => {
    const result = createRequestSchema.safeParse({
      ...validInput,
      maxFiles: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects maxFiles at 101", () => {
    const result = createRequestSchema.safeParse({
      ...validInput,
      maxFiles: 101,
    });
    expect(result.success).toBe(false);
  });

  it("accepts maxFiles at boundaries (1 and 100)", () => {
    expect(
      createRequestSchema.safeParse({ ...validInput, maxFiles: 1 }).success
    ).toBe(true);
    expect(
      createRequestSchema.safeParse({ ...validInput, maxFiles: 100 }).success
    ).toBe(true);
  });

  it("rejects maxFileSizeMb at 0", () => {
    const result = createRequestSchema.safeParse({
      ...validInput,
      maxFileSizeMb: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects maxFileSizeMb at 101", () => {
    const result = createRequestSchema.safeParse({
      ...validInput,
      maxFileSizeMb: 101,
    });
    expect(result.success).toBe(false);
  });

  it("rejects description over 2000 characters", () => {
    const result = createRequestSchema.safeParse({
      ...validInput,
      description: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

describe("updateRequestSchema", () => {
  it("accepts partial updates", () => {
    const result = updateRequestSchema.safeParse({ title: "New Title" });
    expect(result.success).toBe(true);
  });

  it("accepts active toggle", () => {
    const result = updateRequestSchema.safeParse({ active: false });
    expect(result.success).toBe(true);
  });

  it("accepts null for optional fields (clearing)", () => {
    const result = updateRequestSchema.safeParse({
      expiresAt: null,
      maxFiles: null,
      maxFileSizeMb: null,
      allowedFileTypes: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid title", () => {
    const result = updateRequestSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });
});

describe("uploadMetadataSchema", () => {
  const validUpload = {
    requestId: "550e8400-e29b-41d4-a716-446655440000",
    fileName: "logo.png",
    fileSize: 1024000,
    fileType: "image/png",
  };

  it("accepts valid upload metadata", () => {
    const result = uploadMetadataSchema.safeParse(validUpload);
    expect(result.success).toBe(true);
  });

  it("accepts with uploader info", () => {
    const result = uploadMetadataSchema.safeParse({
      ...validUpload,
      uploaderName: "John Doe",
      uploaderEmail: "john@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing requestId", () => {
    const { requestId: _, ...rest } = validUpload;
    const result = uploadMetadataSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID", () => {
    const result = uploadMetadataSchema.safeParse({
      ...validUpload,
      requestId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fileName", () => {
    const { fileName: _, ...rest } = validUpload;
    const result = uploadMetadataSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects zero fileSize", () => {
    const result = uploadMetadataSchema.safeParse({
      ...validUpload,
      fileSize: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative fileSize", () => {
    const result = uploadMetadataSchema.safeParse({
      ...validUpload,
      fileSize: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fileType", () => {
    const { fileType: _, ...rest } = validUpload;
    const result = uploadMetadataSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});
