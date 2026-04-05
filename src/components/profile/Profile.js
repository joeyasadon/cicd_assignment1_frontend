import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile, error, loading } = useAuth();
  console.log('Profile component - user:', user);
  console.log('Profile component - loading:', loading);
  console.log('Profile component - error:', error);
  
  // Extract profile data from nested response
  const profileData = useMemo(() => user?.profile || user || {}, [user]);
  console.log('Profile component - profileData:', profileData);
  console.log('Profile component - date_joined:', profileData.date_joined);
  console.log('Profile component - all profileData keys:', Object.keys(profileData));
  
  const [formData, setFormData] = useState({
    display_name: '',
    phone_number: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (profileData) {
      setFormData({
        display_name: profileData.display_name || '',
        phone_number: profileData.phone_number || '',
      });
    }
  }, [profileData]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage('');

    try {
      await updateProfile(formData);
      setSuccessMessage('Profile updated successfully!');
    } catch (err) {
      // Error is handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile</h1>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="back-button"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="profile-content">
        <div className="profile-info">
          <h2>User Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Display Name:</label>
              <span>{profileData.display_name || 'Not set'}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{profileData.email || 'Not set'}</span>
            </div>
            <div className="info-item">
              <label>Phone Number:</label>
              <span>{profileData.phone_number || 'Not set'}</span>
            </div>
            <div className="info-item">
              <label>Date Joined:</label>
              <span>{profileData.date_joined ? new Date(profileData.date_joined).toLocaleDateString() : 'Not set'}</span>
            </div>
          </div>
        </div>

        <div className="profile-form">
          <h2>Update Profile</h2>
          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="display_name">Display Name</label>
              <input
                type="text"
                id="display_name"
                name="display_name"
                value={formData.display_name}
                onChange={handleChange}
                placeholder="Enter your display name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone_number">Phone Number</label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="+1234567890"
              />
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="update-button"
                disabled={submitting}
              >
                {submitting ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
