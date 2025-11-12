

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // result is "data:image/jpeg;base64,..."
        // we only want the part after the comma
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error("Failed to read file as Base64 string."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file as Data URL."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const loadImageAsDataURLAndDimensions = (file: File): Promise<{ dataUrl: string; width: number; height: number; }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          resolve({
            dataUrl: reader.result as string,
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        };
        img.onerror = (error) => reject(error);
      } else {
        reject(new Error('Failed to read file as data URL.'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


export const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Revoke the object URL to free up memory, if it's a blob URL
    if (dataUrl.startsWith('blob:')) {
      URL.revokeObjectURL(dataUrl);
    }
}

export const dataURLToBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error("Invalid data URL");
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

export const downloadZip = async (files: Array<{ dataUrl: string, filename: string }>, zipFilename: string) => {
  // Dynamically import JSZip
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  files.forEach(file => {
      const base64Data = file.dataUrl.split(',')[1];
      zip.file(file.filename, base64Data, { base64: true });
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = zipFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};