/**
 * Image handling utilities for Unverified Listing Page
 */

import { MAX_IMAGE_COUNT, MAX_IMAGE_TOTAL_SIZE_BYTES } from "./constants";
import { useToast } from "@/hooks/use-toast";

export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function handleImageSelect(
  event: React.ChangeEvent<HTMLInputElement>,
  selectedImages: File[],
  setSelectedImages: React.Dispatch<React.SetStateAction<File[]>>,
  setImagePreviews: React.Dispatch<React.SetStateAction<string[]>>,
  toast: ReturnType<typeof useToast>["toast"]
) {
  const files = event.target.files;
  if (!files) return;

  const filesArray = Array.from(files);
  
  if (selectedImages.length + filesArray.length > MAX_IMAGE_COUNT) {
    toast({
      title: "عدد الصور",
      description: `يمكن رفع حتى ${MAX_IMAGE_COUNT} صورة فقط`,
      variant: "destructive",
    });
    return;
  }

  let totalSize = selectedImages.reduce((sum, img) => sum + img.size, 0);
  const newFiles: File[] = [];
  const newPreviews: string[] = [];

  for (const file of filesArray) {
    if (selectedImages.length + newFiles.length >= MAX_IMAGE_COUNT) break;
    
    totalSize += file.size;
    if (totalSize > MAX_IMAGE_TOTAL_SIZE_BYTES) {
      toast({
        title: "حجم الصور",
        description: `إجمالي حجم الصور يجب أن يكون أقل من ${MAX_IMAGE_TOTAL_SIZE_BYTES / (1024 * 1024)} ميجابايت`,
        variant: "destructive",
      });
      break;
    }

    newFiles.push(file);
    try {
      const dataUrl = await readAsDataUrl(file);
      newPreviews.push(dataUrl);
    } catch (error) {
      console.error("Error reading image:", error);
    }
  }

  if (newFiles.length > 0) {
    setSelectedImages((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  }

  event.target.value = "";
}

export function removeImage(
  index: number,
  setSelectedImages: React.Dispatch<React.SetStateAction<File[]>>,
  setImagePreviews: React.Dispatch<React.SetStateAction<string[]>>
) {
  setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  setImagePreviews((prev) => {
    const url = prev[index];
    if (url.startsWith("data:")) {
      URL.revokeObjectURL(url);
    }
    return prev.filter((_, i) => i !== index);
  });
}

