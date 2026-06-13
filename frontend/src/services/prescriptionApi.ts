import { BASE_URL } from './api';

export const prescriptionApi = {
  uploadPrescription: async (file: File): Promise<{ medicines: string[], imageUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/prescriptions/temp-verify`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload prescription');
    }

    return response.json();
  },

  savePrescription: async (medicines: string[], imageUrl: string, userId?: string): Promise<void> => {
    const response = await fetch(`${BASE_URL}/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ medicines, imageUrl, userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to save prescription');
    }
  }
};
