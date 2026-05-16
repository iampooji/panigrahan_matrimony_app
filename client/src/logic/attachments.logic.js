import { api } from "../api/apiClient";

export const getAttachments = (attachableType, attachableId) => {
  return api(`/attachments/${attachableType}/${attachableId}`);
};

export const uploadAttachments = (attachableType, attachableId, files, photoType) => {
  const formData = new FormData();

   if (Array.isArray(files) || files instanceof FileList) {
    for (const file of files) {
      formData.append("files", file);
    }
  } else {
    formData.append("files", files);
  }

  if (photoType) {
    formData.append("photo_type", photoType);
  }

  return api(`/attachments/${attachableType}/${attachableId}`, {
    method: "POST",
    body: formData,
    headers: {} // let browser set multipart boundary
  });
};

export const deleteAttachments = (id) => {
  return api(`/attachments/${id}`, {
    method: "post"
  });
  // return api.delete(`/attachments/${id}`);
};
