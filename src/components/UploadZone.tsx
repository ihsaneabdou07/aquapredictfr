// src/components/UploadZone.tsx
import { useState } from 'react';

export const UploadZone = ({ onAnalyze }) => {
  const handleFile = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    // Envoi vers votre API locale (FastAPI)
    const res = await fetch('http://localhost:8000/analyze-network', {
      method: 'POST',
      body: formData
    });
    const result = await res.json();
    onAnalyze(result); // result contient les coordonnées des capteurs
  };

  return <input type="file" onChange={handleFile} accept="image/*" />;
};