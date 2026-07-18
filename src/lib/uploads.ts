// Client-side file upload helper.
// Uses an unsigned upload preset — no API secret is exposed to the browser.
// The vendor name is intentionally NOT shown anywhere in the UI.

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";

export const UPLOAD_CONFIGURED = Boolean(CLOUD_NAME && UPLOAD_PRESET);

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB per file
export const MAX_FILES = 5;

export const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export interface UploadedFile {
  url: string;
  name: string;
  size: number;
  type: string;
  publicId?: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number; // 0–100
  status: "uploading" | "done" | "error";
  error?: string;
  result?: UploadedFile;
}

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `${file.name} is ${(file.size / 1024 / 1024).toFixed(1)} MB — max 25 MB.`;
  }
  // Allow if MIME matches OR if extension is in allow-list (some browsers omit MIME for zip/docx)
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const extOk = ["png", "jpg", "jpeg", "gif", "webp", "pdf", "zip", "doc", "docx"].includes(ext);
  if (!ALLOWED_TYPES.includes(file.type) && !extOk) {
    return `${file.name} — unsupported type. Use PNG, JPG, GIF, WebP, PDF, ZIP, DOC or DOCX.`;
  }
  return null;
}

export async function uploadFile(
  file: File,
  onProgress?: (p: UploadProgress) => void
): Promise<UploadedFile> {
  if (!UPLOAD_CONFIGURED) {
    throw new Error("Uploads are not configured. Set NEXT_PUBLIC_CLOUDINARY_* env vars.");
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "client-submissions");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress({ fileName: file.name, progress: pct, status: "uploading" });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          onProgress?.({
            fileName: file.name,
            progress: 100,
            status: "done",
            result: {
              url: res.secure_url,
              name: file.name,
              size: file.size,
              type: file.type || res.format,
              publicId: res.public_id,
            },
          });
          resolve({
            url: res.secure_url,
            name: file.name,
            size: file.size,
            type: file.type || res.format,
            publicId: res.public_id,
          });
        } catch {
          onProgress?.({ fileName: file.name, progress: 0, status: "error", error: "Bad response." });
          reject(new Error("Could not parse upload response."));
        }
      } else {
        let msg = `Upload failed (${xhr.status}).`;
        try {
          const err = JSON.parse(xhr.responseText);
          if (err?.error?.message) msg = err.error.message;
        } catch {}
        onProgress?.({ fileName: file.name, progress: 0, status: "error", error: msg });
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => {
      onProgress?.({ fileName: file.name, progress: 0, status: "error", error: "Network error." });
      reject(new Error("Network error during upload."));
    };

    xhr.send(formData);
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
