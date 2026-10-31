'use client';
import { useState } from 'react';
import styles from './MedicationModal.module.css';

export default function MedicationModal({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && time) {
      onAdd({
        id: Date.now().toString(),
        name,
        dosage,
        time,
      });
      setName('');
      setDosage('');
      setTime('');
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="medModalTitle">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 id="medModalTitle" className={styles.modalTitle}>Log Medication</h2>
          <button onClick={onClose} className={styles.closeBtn} aria-label="Close modal">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Medication Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              placeholder="e.g. Albuterol"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Dosage (Optional)</label>
            <input
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              className={styles.input}
              placeholder="e.g. 2 puffs"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Time Taken</label>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={styles.input}
            />
          </div>

          <button type="submit" className={styles.submitBtn}>
            Save Log
          </button>
        </form>
      </div>
    </div>
  );
}
