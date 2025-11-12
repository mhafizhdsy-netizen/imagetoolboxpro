
const getUpscalerApiKey = (): string => {
    const defaultKey = '196f25947emsh0201c523a966043p1a26aejsn23a6aa1c412f';
    try {
        const settingsJSON = localStorage.getItem('image-toolbox-settings');
        if (settingsJSON) {
            const settings = JSON.parse(settingsJSON);
            return settings.upscalerApiKey || defaultKey;
        }
    } catch (e) {
        console.error("Could not parse settings for upscaler key.", e);
    }
    return defaultKey;
}

const getBgRemoverApiKey = (): string => {
    // NOTE: This default key is for demonstration and has very low rate limits.
    // Users should be encouraged to get their own free key from RapidAPI.
    const defaultKey = '196f25947emsh0201c523a966043p1a26aejsn23a6aa1c412f';
    try {
        const settingsJSON = localStorage.getItem('image-toolbox-settings');
        if (settingsJSON) {
            const settings = JSON.parse(settingsJSON);
            // Use new key if available, otherwise fallback to old slazzer for migration, then default
            return settings.bgRemoverApiKey || settings.slazzerApiKey || defaultKey;
        }
    } catch (e) {
        console.error("Could not parse settings for Background Remover key.", e);
    }
    return defaultKey;
}

const handleApiError = async (response: Response): Promise<Error> => {
    let errorMessage = `API Error: ${response.status}`;
    let errorDetails = response.statusText;
    try {
        const errorBodyText = await response.text();
        try {
            const errorJson = JSON.parse(errorBodyText);
            errorDetails = errorJson.message || errorJson.error || errorBodyText;
        } catch {
            errorDetails = errorBodyText || errorDetails;
        }
    } catch (e) {
        // Could not read body, stick with statusText.
    }

    errorMessage = `${errorMessage} - ${errorDetails}`;

    if (response.status === 401 || response.status === 403) {
        errorMessage += ". The provided RapidAPI Key is invalid or missing permissions.";
    }
    if (response.status === 429) {
        errorMessage += ". You have exceeded the usage limit for your API key. Please check your RapidAPI dashboard or add a new key in settings.";
    }
    if (response.status === 400) {
        errorMessage += ". This is a 'Bad Request' error, likely due to an unsupported image format or size.";
    }
    return new Error(errorMessage);
}


export const removeBackgroundWithAI = async (imageFile: File): Promise<string> => {
    const apiKey = getBgRemoverApiKey();
    if (!apiKey) {
        throw new Error("AI Remove Image Background API Key is not set. Please add one in the API Key Settings.");
    }
    
    try {
        const formData = new FormData();
        formData.append('file', imageFile);

        const response = await fetch('https://ai-remove-image-background.p.rapidapi.com/', {
            method: 'POST',
            headers: {
                // 'content-type' is automatically set by the browser for FormData
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'ai-remove-image-background.p.rapidapi.com',
            },
            body: formData,
        });

        if (!response.ok) {
            throw await handleApiError(response);
        }
        
        const imageBlob = await response.blob();
        if (!imageBlob.type.startsWith('image/')) {
            const errorText = await imageBlob.text();
            let errorMessage = "The API returned an unexpected non-image response. ";
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage += errorJson.message || errorJson.error || "No specific error message was provided.";
            } catch(e) {
                errorMessage += `Details: ${errorText}`;
            }
            throw new Error(errorMessage);
        }
        
        return URL.createObjectURL(imageBlob);

    } catch (error) {
        console.error("Error with AI background removal:", error);
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
             throw new Error('A network error occurred. This could be a CORS issue, a problem with your network, or an ad blocker interfering. Please check your browser console for more details.');
        }
        throw error;
    }
};


export const upscaleImageWithAI = async (imageFile: File): Promise<string> => {
  const MAX_DIM = 1000;
  let imageToSend: File | Blob = imageFile;

  const imageUrl = URL.createObjectURL(imageFile);
  const img = new Image();
  
  const resizePromise = new Promise<void>((resolve) => {
    img.onload = () => {
      URL.revokeObjectURL(imageUrl);
      const { width, height } = img;
      
      if (width > MAX_DIM || height > MAX_DIM) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve();
          return;
        }
        const aspectRatio = width / height;
        if (width > height) {
          canvas.width = MAX_DIM;
          canvas.height = MAX_DIM / aspectRatio;
        } else {
          canvas.height = MAX_DIM;
          canvas.width = MAX_DIM * aspectRatio;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) { imageToSend = blob; }
          resolve();
        }, imageFile.type, 0.95);
      } else {
        resolve();
      }
    };
    img.onerror = () => { URL.revokeObjectURL(imageUrl); resolve(); }
    img.src = imageUrl;
  });

  await resizePromise;

  const formData = new FormData();
  formData.append('image', imageToSend);

  const apiKey = getUpscalerApiKey();
  if (!apiKey) {
      throw new Error("RapidAPI key for AI Picture Upscaler is not set. Please add a key in settings.");
  }

  try {
    const response = await fetch('https://ai-picture-upscaler.p.rapidapi.com/upscaler/', {
      method: 'POST',
      headers: {
        'x-rapidapi-host': 'ai-picture-upscaler.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
      },
      body: formData,
    });
    
    if (!response.ok) {
        throw await handleApiError(response);
    }
    const imageBlob = await response.blob();
    return URL.createObjectURL(imageBlob);

  } catch (error) {
      console.error("Error with AI Picture Upscaler:", error);
      throw error;
  }
};
