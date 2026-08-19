export const compressImage = (file: File, maxDimension = 1600, quality = 0.75): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onerror = () => reject(new Error('Bilden kunde inte läsas.'))
  reader.onload = () => {
    const img = new Image()
    img.onerror = () => reject(new Error('Bilden kunde inte bearbetas.'))
    img.onload = () => {
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Bildbehandling stöds inte i webbläsaren.'))
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = String(reader.result)
  }
  reader.readAsDataURL(file)
})
