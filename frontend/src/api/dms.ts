// src/api/dms.ts
import api from './client';

export interface CreateDocumentWithVersionPayload {
  businessUnitId: number;
  title: string;
  categoryId?: number | '';
  typeId?: number | '';
  status?: string;
  changeSummary?: string;
  file?: File | null;
  htmlContent?: string;
}

export interface CreateDocumentWithVersionResponse {
  document_id: number;
  version_id: number;
  message: string;
}

/**
 * Create a new Document + initial DocumentVersion via the combined endpoint.
 * Backend: POST /api/dms/new-document/
 */
export async function createDocumentWithVersion(
  payload: CreateDocumentWithVersionPayload,
): Promise<CreateDocumentWithVersionResponse> {
  const {
    businessUnitId,
    title,
    categoryId,
    typeId,
    status,
    changeSummary,
    file,
    htmlContent,
  } = payload;

  const formData = new FormData();

  formData.append('business_unit', String(businessUnitId));
  formData.append('title', title);

  if (categoryId) {
    formData.append('category', String(categoryId));
  }
  if (typeId) {
    formData.append('type', String(typeId));
  }
  if (status) {
    formData.append('status', status);
  }
  if (changeSummary) {
    formData.append('change_summary', changeSummary);
  }

  if (file) {
    formData.append('file', file);
  } else if (htmlContent) {
    formData.append('html_content', htmlContent);
  }

  const response = await api.post<CreateDocumentWithVersionResponse>(
    'dms/new-document/',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
}
