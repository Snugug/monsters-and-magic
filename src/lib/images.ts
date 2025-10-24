export async function blobToBase64(blob: Blob): Promise<string> {
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  return new Promise((resolve, reject) => {
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject('Unable to resolve as string');
      }
    };
  });
}

export async function fileToImage(file: File) {
  const imageBlob = await (await fetch(URL.createObjectURL(file))).blob();
  return blobToBase64(imageBlob);
}

export async function stringToImage(image: string) {
  return (await fetch(image)).blob();
}
