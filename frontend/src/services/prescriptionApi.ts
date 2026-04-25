export const prescriptionApi = {
  uploadPrescription: async (file: File): Promise<{ medicines: string[], imageUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:3000/prescriptions/temp-verify', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload prescription');
    }

    return response.json();
  },

  savePrescription: async (medicines: string[], imageUrl: string, userId?: string): Promise<void> => {
    const response = await fetch('http://localhost:3000/prescriptions', {
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
