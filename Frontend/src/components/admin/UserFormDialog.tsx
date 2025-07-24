import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  is_active: boolean;
  is_verified: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login: string;
  profile?: {
    phone: string;
    location_text: string;
    current_job_title: string;
    experience_level: string;
  };
}

interface UserFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  user?: User | null;
}

const UserFormDialog: React.FC<UserFormDialogProps> = ({
  open,
  onClose,
  onSave,
  user
}) => {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    user_type: 'job_seeker',
    is_active: true,
    is_verified: false,
    is_staff: false,
    is_superuser: false,
    phone: '',
    location_text: '',
    current_job_title: '',
    experience_level: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        user_type: user.user_type || 'job_seeker',
        is_active: user.is_active,
        is_verified: user.is_verified,
        is_staff: user.is_staff,
        is_superuser: user.is_superuser,
        phone: user.profile?.phone || '',
        location_text: user.profile?.location_text || '',
        current_job_title: user.profile?.current_job_title || '',
        experience_level: user.profile?.experience_level || '',
      });
    } else {
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        user_type: 'job_seeker',
        is_active: true,
        is_verified: false,
        is_staff: false,
        is_superuser: false,
        phone: '',
        location_text: '',
        current_job_title: '',
        experience_level: '',
      });
    }
    setErrors({});
  }, [user, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.first_name) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.user_type) {
      newErrors.user_type = 'User type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const userData = {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        user_type: formData.user_type,
        is_active: formData.is_active,
        is_verified: formData.is_verified,
        is_staff: formData.is_staff,
        is_superuser: formData.is_superuser,
        profile: {
          phone: formData.phone,
          location_text: formData.location_text,
          current_job_title: formData.current_job_title,
          experience_level: formData.experience_level,
        },
      };

      const url = user 
        ? `http://127.0.0.1:8000/api/v1/users/admin-users/${user.id}/`
        : 'http://127.0.0.1:8000/api/v1/users/admin-users/';

      const response = await fetch(url, {
        method: user ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        onSave();
        onClose();
      } else {
        const errorData = await response.json();
        const errorMessages: Record<string, string> = {};
        
        Object.keys(errorData).forEach(key => {
          if (Array.isArray(errorData[key])) {
            errorMessages[key] = errorData[key][0];
          } else {
            errorMessages[key] = errorData[key];
          }
        });
        
        setErrors(errorMessages);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      setErrors({ general: 'Failed to save user. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {user ? 'Edit User' : 'Create New User'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.general}
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserIcon className="w-5 h-5 mr-2" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.first_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter first name"
                />
                {errors.first_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.last_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter last name"
                />
                {errors.last_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter email address"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* User Type and Permissions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ShieldCheckIcon className="w-5 h-5 mr-2" />
              User Type & Permissions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Type *
                </label>
                <select
                  value={formData.user_type}
                  onChange={(e) => handleInputChange('user_type', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.user_type ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="job_seeker">Job Seeker</option>
                  <option value="employer">Employer</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.user_type && (
                  <p className="text-red-500 text-sm mt-1">{errors.user_type}</p>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Permissions</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => handleInputChange('is_active', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active User</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_verified}
                      onChange={(e) => handleInputChange('is_verified', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Verified User</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_staff}
                      onChange={(e) => handleInputChange('is_staff', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Staff Member</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_superuser}
                      onChange={(e) => handleInputChange('is_superuser', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Superuser</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BriefcaseIcon className="w-5 h-5 mr-2" />
              Profile Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.location_text}
                    onChange={(e) => handleInputChange('location_text', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter location"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Job Title
                </label>
                <input
                  type="text"
                  value={formData.current_job_title}
                  onChange={(e) => handleInputChange('current_job_title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter job title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  value={formData.experience_level}
                  onChange={(e) => handleInputChange('experience_level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select experience level</option>
                  <option value="entry_level">Entry Level</option>
                  <option value="mid_level">Mid Level</option>
                  <option value="senior_level">Senior Level</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormDialog; 