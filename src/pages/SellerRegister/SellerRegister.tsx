// src/pages/SellerRegister/SellerRegister.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SellerRegister.module.css';

const SellerRegister: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    storeName: '',
  });
  const [errors, setErrors] = useState<Partial<typeof formData>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Partial<typeof formData> = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = 'Valid email is required';
    if (!formData.storeName.trim()) newErrors.storeName = 'Store name is required';
    if (formData.password.length < 6) newErrors.password = 'Min. 6 characters';
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    // Simulate API call
    await new Promise(res => setTimeout(res, 1200));
    setLoading(false);
    navigate('/seller/home', {
      state: { username: formData.username, storeName: formData.storeName },
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Icon + Title */}
        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <h1 className={styles.title}>Seller Account</h1>
          <p className={styles.subtitle}>Create your store on CoreSystems</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Username</label>
              <input
                className={`${styles.input} ${errors.username ? styles.inputError : ''}`}
                type="text"
                name="username"
                placeholder="your_username"
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
              />
              {errors.username && <span className={styles.error}>{errors.username}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Store Name</label>
              <input
                className={`${styles.input} ${errors.storeName ? styles.inputError : ''}`}
                type="text"
                name="storeName"
                placeholder="My Tech Store"
                value={formData.storeName}
                onChange={handleChange}
              />
              {errors.storeName && <span className={styles.error}>{errors.storeName}</span>}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email address</label>
            <input
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
            />
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <input
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              {errors.password && <span className={styles.error}>{errors.password}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Confirm Password</label>
              <input
                className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
              {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword}</span>}
            </div>
          </div>

          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              'Create Seller Account'
            )}
          </button>
        </form>

        <p className={styles.loginLink}>
          Already have an account?{' '}
          <button className={styles.linkBtn} onClick={() => navigate('/login')}>
            Sign in
          </button>
        </p>

        <p className={styles.legal}>
          By continuing, you agree to our{' '}
          <a href="#" className={styles.legalLink}>Terms of Use</a> and authorize the
          processing of your personal data in accordance with{' '}
          <a href="#" className={styles.legalLink}>Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default SellerRegister;