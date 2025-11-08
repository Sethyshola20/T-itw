import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import * as utils from "./index";
import { Readable } from "stream";

vi.spyOn(os, "platform").mockReturnValue("darwin");

vi.mock("stream/promises", async () => {
  const actual = await vi.importActual<any>("stream/promises");
  return {
    ...actual,
    pipeline: vi.fn().mockResolvedValue(undefined),
  };
});

// Mock fs.createWriteStream
vi.mock("fs", async () => {
  const actual = await vi.importActual<any>("fs");
  return {
    ...actual,
    createWriteStream: vi.fn(() => ({
      on: vi.fn(),
      end: vi.fn(),
    })),
  };
});

global.fetch = vi.fn();

// --- Helpers ---
function createMockFile(name: string, type: string, content: string) {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
}

describe("File Utilities", () => {
  describe("validateFileType", () => {
    it("returns extension for valid PDF", async () => {
      const file = createMockFile(
        "document.pdf",
        "application/pdf",
        "%PDF-1.4",
      );
      const ext = await utils.validateFileType(file);
      expect(ext).toBe("pdf");
    });

    it("throws for invalid file type", async () => {
      const file = createMockFile("image.png", "image/png", "PNG...");
      await expect(utils.validateFileType(file)).rejects.toThrow(
        /Invalid file format/,
      );
    });
  });

  describe("validatePdfUrl", () => {
    it("accepts valid PDF URL", async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        headers: {
          get: (key: string) =>
            key === "content-type" ? "application/pdf" : "1024",
        },
        status: 200,
      });

      const url = "https://example.com/file.pdf";
      await expect(utils.validatePdfUrl(url)).resolves.toBe(url);
    });

    it("rejects invalid URL", async () => {
      await expect(utils.validatePdfUrl("not-a-url")).rejects.toThrow(
        /Invalid URL/,
      );
    });

    it("rejects non-PDF content", async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        headers: { get: () => "text/html" },
        status: 200,
      });
      await expect(
        utils.validatePdfUrl("https://example.com/file.pdf"),
      ).rejects.toThrow(/Link is not a PDF/);
    });
  });

  describe("validateFileHeader", () => {
    it("passes with valid PDF header", async () => {
      const file = createMockFile("file.pdf", "application/pdf", "%PDF-test");
      await expect(utils.validateFileHeader(file)).resolves.toBe(true);
    });

    it("throws for invalid PDF header", async () => {
      const file = createMockFile("file.pdf", "application/pdf", "abcd");
      await expect(utils.validateFileHeader(file)).rejects.toThrow(
        /does not appear to be a valid PDF/,
      );
    });
  });

  describe("saveFile", () => {
    it("saves file and returns path", async () => {
      const file = createMockFile("file.pdf", "application/pdf", "%PDF-1.4");
      const savedPath = await utils.saveFile(file, "file.pdf");
      expect(savedPath).toContain("uploads/file.pdf");
    });
  });

  describe("saveFileFromUrl", () => {
    it("fetches and saves PDF file", async () => {
      const mockBody = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("%PDF-1.4"));
          controller.close();
        },
      });

      (fetch as any).mockResolvedValue({
        ok: true,
        headers: { get: () => "application/pdf" },
        body: mockBody,
      });

      const path = await utils.saveFileFromUrl(
        "https://example.com/file.pdf",
        "file.pdf",
      );
      expect(path).toContain("uploads/file.pdf");
    });
  });

  describe("extractTextFromUrl", () => {
    it("extracts text from HTML", async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        text: async () => "<html><body>Hello World</body></html>",
      });
      const text = await utils.extractTextFromUrl("https://example.com");
      expect(text).toContain("Hello World");
    });
  });
});
