import React, { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { uploadProductImage } from '../../services/storageService'
import styles from './AddProductModal.module.css'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

type Status = 'idle' | 'uploading' | 'saving' | 'done' | 'error'

const CATEGORIES = ['smartphones', 'laptops', 'tablets', 'consoles', 'televisions', 'smartwatches']

const AddProductModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [name, setName]         = useState('')
  const [brand, setBrand]       = useState('')
  const [price, setPrice]       = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview]   = useState<string | null>(null)
  const [status, setStatus]     = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    // Preview local inmediato — sin subir nada todavía
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!imageFile) { setErrorMsg('Selecciona una imagen.'); return }
    if (!name.trim() || !price.trim()) { setErrorMsg('Nombre y precio son obligatorios.'); return }

    setErrorMsg('')

    try {
      // 1. Subir imagen → obtener URL pública
      setStatus('uploading')
      const imageUrl = await uploadProductImage(imageFile)

      // 2. Guardar producto en Supabase DB (tabla "products")
      setStatus('saving')
      const { error } = await supabase.from('products').insert({
        name:      name.trim(),
        brand:     brand.trim(),
        price:     Number(price),
        category,
        image_url: imageUrl,
      })

      if (error) throw new Error(error.message)

      setStatus('done')
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 800)

    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Error inesperado')
    }
  }

  const isLoading = status === 'uploading' || status === 'saving'

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">✕</button>
        <h2 className={styles.title}>Agregar producto</h2>

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* ── Zona de imagen ── */}
          <div
            className={`${styles.imageZone} ${preview ? styles.imageZoneWithPreview : ''}`}
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt="Preview" className={styles.previewImg} />
            ) : (
              <div className={styles.imagePlaceholder}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span>Haz clic para seleccionar imagen</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={styles.hiddenInput}
            />
          </div>

          {/* ── Campos del formulario ── */}
          <div className={styles.fields}>
            <label className={styles.label}>
              Nombre del producto *
              <input
                className={styles.input}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: iPhone 17 Pro"
                required
              />
            </label>

            <label className={styles.label}>
              Marca
              <input
                className={styles.input}
                type="text"
                value={brand}
                onChange={e => setBrand(e.target.value)}
                placeholder="Ej: Apple"
              />
            </label>

            <label className={styles.label}>
              Precio (COP) *
              <input
                className={styles.input}
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="Ej: 3500000"
                min="0"
                required
              />
            </label>

            <label className={styles.label}>
              Categoría
              <select
                className={styles.input}
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          {errorMsg && <p className={styles.error}>{errorMsg}</p>}

          <button
            type="submit"
            className={`${styles.submitBtn} ${status === 'done' ? styles.submitBtnDone : ''}`}
            disabled={isLoading}
          >
            {status === 'uploading' && 'Subiendo imagen…'}
            {status === 'saving'    && 'Guardando producto…'}
            {status === 'done'      && '¡Publicado! ✓'}
            {status === 'error'     && 'Reintentar'}
            {status === 'idle'      && 'Publicar producto'}
          </button>

        </form>
      </div>
    </div>
  )
}

export default AddProductModal
