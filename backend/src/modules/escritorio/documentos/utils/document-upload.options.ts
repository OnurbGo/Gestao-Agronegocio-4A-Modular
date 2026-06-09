export const documentUploadOptions = {
  limits: {
    fileSize: Number(process.env.DOCUMENT_UPLOAD_MAX_BYTES || 25 * 1024 * 1024),
  },
};
