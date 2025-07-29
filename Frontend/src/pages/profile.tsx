import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { 
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  CameraIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  LinkIcon,
  StarIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  CogIcon,
  BellIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  skills: string;
  experience: string;
  education: string;
  website: string;
  linkedin: string;
  github: string;
  resume?: string;
}

interface Resume {
  id: string;
  original_filename: string;
  file_url: string;
  file_size_display: string;
  parsing_status_display: string;
  is_primary: boolean;
  created_at: string;
  parsing_status: string;
  confidence_score?: number;
}

interface JobCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
}

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    skills: '',
    experience: '',
    education: '',
    website: '',
    linkedin: '',
    github: '',
    resume: ''
  });
  
  const [userResumes, setUserResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [editingJobInterests, setEditingJobInterests] = useState(false);
  const [tempSelectedCategories, setTempSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfileData();
      fetchUserResumes();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchJobCategories();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setProfileLoading(true);
      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/profile/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const profileData = await response.json();
        setFormData({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          location: profileData.location || '',
          bio: profileData.bio || '',
          skills: profileData.skills || '',
          experience: profileData.experience || '',
          education: profileData.education || '',
          website: profileData.website || '',
          linkedin: profileData.linkedin_url || '',
          github: profileData.github_url || '',
          resume: profileData.resume || ''
        });
        
        // Set selected resume to primary resume if available
        if (userResumes.length > 0) {
          const primaryResume = userResumes.find(resume => resume.is_primary);
          if (primaryResume) {
            setSelectedResumeId(primaryResume.id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchUserResumes = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/resumes/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserResumes(data.results || []);
        
        // Set selected resume to primary resume if available
        if (data.results && data.results.length > 0) {
          const primaryResume = data.results.find((resume: Resume) => resume.is_primary);
          if (primaryResume) {
            setSelectedResumeId(primaryResume.id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user resumes:', error);
    }
  };

  const fetchJobCategories = async () => {
    try {
      // Fetch all job categories
      const categoriesResponse = await fetch('http://127.0.0.1:8000/api/v1/jobs/job-categories/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setJobCategories(categoriesData || []);
      }

      // Fetch user's preferred categories
      const profileResponse = await fetch('http://127.0.0.1:8000/api/v1/users/profiles/profile/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setPreferredCategories(profileData.preferred_job_categories || []);
        setTempSelectedCategories(profileData.preferred_job_categories || []);
      }
    } catch (error) {
      console.error('Error fetching job categories:', error);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/profile/', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
          skills: formData.skills,
          experience: formData.experience,
          website: formData.website,
          linkedin_url: formData.linkedin,
          github_url: formData.github
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
      setSuccess('Profile updated successfully!');
      setEditing(false);
        await refreshProfile();
      setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to update profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setError('');
    setSuccess('');
    fetchProfileData();
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        setError('');
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('is_primary', 'true');
        
        const response = await fetch('http://127.0.0.1:8000/api/v1/resumes/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: formData,
        });
        
        if (response.ok) {
          const data = await response.json();
          setSuccess('Resume uploaded successfully!');
          setTimeout(() => setSuccess(''), 3000);
          
          // Refresh resumes and profile data
          await fetchUserResumes();
          await fetchProfileData();
        } else {
          let errorMessage = 'Failed to upload resume';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.detail || errorMessage;
          } catch (e) {
            // If response is not JSON, use the status text
            errorMessage = response.statusText || errorMessage;
          }
          setError(errorMessage);
        }
      } catch (err: any) {
        console.error('Resume upload error:', err);
        setError(err.message || 'Failed to upload resume');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResumeSelection = (resumeId: string) => {
    setSelectedResumeId(resumeId);
  };

  const handleSetPrimaryResume = async (resumeId: string) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`http://127.0.0.1:8000/api/v1/resumes/${resumeId}/set_primary/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setSuccess('Primary resume updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
        
        // Refresh resumes
        await fetchUserResumes();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to set primary resume');
      }
    } catch (err: any) {
      console.error('Set primary resume error:', err);
      setError(err.message || 'Failed to set primary resume');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`http://127.0.0.1:8000/api/v1/resumes/${resumeId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (response.ok) {
        setSuccess('Resume deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
        
        // Refresh resumes
        await fetchUserResumes();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete resume');
      }
    } catch (err: any) {
      console.error('Delete resume error:', err);
      setError(err.message || 'Failed to delete resume');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">Please log in to access your profile.</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Sign In
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: UserIcon },
    { id: 'personal', name: 'Personal Info', icon: UserIcon },
    { id: 'professional', name: 'Professional', icon: BriefcaseIcon },
    { id: 'education', name: 'Education', icon: AcademicCapIcon },
    { id: 'resume', name: 'Resume', icon: DocumentTextIcon },
    { id: 'job-interests', name: 'Job Interests', icon: TagIcon },
    { id: 'settings', name: 'Settings', icon: CogIcon }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <UserIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
                  </div>
                  <p className="text-gray-600">Manage your professional profile and preferences</p>
                </div>
                <div className="flex space-x-3">
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      disabled={profileLoading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex space-x-3">
                      <button
                        onClick={handleCancel}
                        className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckIcon className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {(success || error) && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center"
              >
                <CheckIcon className="h-5 w-5 mr-2" />
                {success}
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center"
              >
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                {error}
              </motion.div>
            )}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {profileLoading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading profile data...</span>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Profile Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                          <UserIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Profile Completeness</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {(() => {
                              const fields = [
                                formData.first_name, formData.last_name, formData.email,
                                formData.phone, formData.location, formData.bio,
                                formData.skills, formData.experience, formData.education
                              ];
                              const filledFields = fields.filter(field => field && field.trim() !== '').length;
                              return Math.round((filledFields / fields.length) * 100);
                            })()}%
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
                          <DocumentTextIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Resume Status</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {userResumes.length > 0 ? `${userResumes.length} Uploaded` : 'Not Uploaded'}
                          </p>
                          {userResumes.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {userResumes.find(r => r.is_primary)?.original_filename || 'No primary resume'}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 p-2 bg-yellow-100 rounded-lg">
                          <StarIcon className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Skills Listed</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formData.skills ? formData.skills.split(',').filter(skill => skill.trim() !== '').length : 0}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                    >
                                              <div className="flex items-center">
                          <div className="flex-shrink-0 p-2 bg-purple-100 rounded-lg">
                            <LinkIcon className="h-6 w-6 text-purple-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Social Links</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {[formData.website, formData.linkedin, formData.github].filter(link => link && link.trim() !== '').length}
                            </p>
                          </div>
                        </div>
                    </motion.div>
                  </div>

                  {/* Profile Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Basic Info */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200"
                    >
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center space-x-4 mb-6">
                          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserIcon className="h-10 w-10 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="text-xl font-semibold text-gray-900">
                              {formData.first_name} {formData.last_name}
                            </h4>
                            <p className="text-gray-600">{formData.email}</p>
                            {formData.location && (
                              <p className="text-gray-500 flex items-center mt-1">
                                <MapPinIcon className="h-4 w-4 mr-1" />
                                {formData.location}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {formData.bio && (
                          <div className="mb-6">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Bio</h5>
                            <p className="text-gray-600">{formData.bio}</p>
                          </div>
                        )}

                        {formData.skills && (
                          <div className="mb-6">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Skills</h5>
                            <div className="flex flex-wrap gap-2">
                              {formData.skills.split(',').map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                                >
                                  {skill.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                    >
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                      </div>
                      <div className="p-6 space-y-4">
                        <button
                          onClick={() => setActiveTab('resume')}
                          className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-3" />
                            <span className="text-sm font-medium text-gray-900">Upload Resume</span>
                          </div>
                          <CameraIcon className="h-4 w-4 text-gray-400" />
                        </button>

                        <button
                          onClick={() => setActiveTab('professional')}
                          className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <BriefcaseIcon className="h-5 w-5 text-green-600 mr-3" />
                            <span className="text-sm font-medium text-gray-900">Update Experience</span>
                          </div>
                          <PencilIcon className="h-4 w-4 text-gray-400" />
                        </button>

                        <button
                          onClick={() => setActiveTab('settings')}
                          className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <CogIcon className="h-5 w-5 text-purple-600 mr-3" />
                            <span className="text-sm font-medium text-gray-900">Privacy Settings</span>
                          </div>
                          <ShieldCheckIcon className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}

          {activeTab === 'personal' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <UserIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    disabled={!editing}
                    placeholder="City, State, Country"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                      </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={!editing}
                    rows={4}
                    placeholder="Tell us about yourself..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'professional' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BriefcaseIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Professional Information</h3>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills
                  </label>
                  <textarea
                    name="skills"
                    value={formData.skills}
                    onChange={handleInputChange}
                    disabled={!editing}
                    rows={3}
                        placeholder="Enter your skills (comma-separated)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                        Work Experience
                  </label>
                  <textarea
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    disabled={!editing}
                        rows={6}
                    placeholder="Describe your work experience..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="https://yourwebsite.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GitHub
                    </label>
                    <input
                      type="url"
                      name="github"
                      value={formData.github}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="https://github.com/yourusername"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                {/* Resume Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selected Resume
                  </label>
                  {userResumes.length > 0 ? (
                    <div className="flex items-center space-x-3">
                      <select
                        value={selectedResumeId}
                        onChange={(e) => handleResumeSelection(e.target.value)}
                        disabled={!editing}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        <option value="">Select a resume</option>
                        {userResumes.map((resume) => (
                          <option key={resume.id} value={resume.id}>
                            {resume.original_filename} {resume.is_primary ? '(Primary)' : ''}
                          </option>
                        ))}
                      </select>
                      {selectedResumeId && (
                        <button
                          type="button"
                          onClick={() => {
                            const resume = userResumes.find(r => r.id === selectedResumeId);
                            if (resume) {
                              window.open(resume.file_url, '_blank');
                            }
                          }}
                          className="px-3 py-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      No resumes uploaded. 
                      <button
                        type="button"
                        onClick={() => setActiveTab('resume')}
                        className="text-blue-600 hover:text-blue-700 ml-1"
                      >
                        Upload your first resume
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'job-interests' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <TagIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Job Interests</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    {editingJobInterests ? 'Edit Job Interests' : 'Your Job Interests'}
                  </h4>
                                     {!editingJobInterests && (
                     <button
                       onClick={() => {
                         setEditingJobInterests(true);
                         setTempSelectedCategories(preferredCategories);
                       }}
                       className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full text-xs font-medium"
                     >
                       Edit
                     </button>
                   )}
                </div>

                {editingJobInterests ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Job Categories
                      </label>
                                             <div className="flex flex-wrap gap-2">
                         {jobCategories.map((category) => (
                           <span
                             key={category.id}
                             className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${
                               tempSelectedCategories.includes(category.id)
                                 ? 'bg-blue-100 text-blue-800'
                                 : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                             }`}
                             onClick={() => {
                               const newSelected = [...tempSelectedCategories];
                               if (newSelected.includes(category.id)) {
                                 newSelected.splice(newSelected.indexOf(category.id), 1);
                               } else {
                                 newSelected.push(category.id);
                               }
                               setTempSelectedCategories(newSelected);
                             }}
                           >
                             {category.name}
                           </span>
                         ))}
                       </div>
                    </div>
                    <div className="flex justify-end space-x-3">
                                             <button
                         onClick={() => {
                           setEditingJobInterests(false);
                           setTempSelectedCategories(preferredCategories);
                         }}
                         className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium"
                       >
                         Cancel
                       </button>
                       <button
                         onClick={async () => {
                           setLoading(true);
                           setError('');
                           setSuccess('');
                           try {
                             const response = await fetch('http://127.0.0.1:8000/api/v1/users/profiles/update-preferences/', {
                               method: 'PATCH',
                               headers: {
                                 'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                                 'Content-Type': 'application/json',
                               },
                               body: JSON.stringify({
                                 preferred_job_categories: tempSelectedCategories
                               }),
                             });

                             if (response.ok) {
                               setSuccess('Job interests updated successfully!');
                               setTimeout(() => setSuccess(''), 3000);
                               setEditingJobInterests(false);
                               setPreferredCategories(tempSelectedCategories);
                               await refreshProfile();
                             } else {
                               const errorData = await response.json();
                               setError(errorData.error || 'Failed to update job interests');
                             }
                           } catch (err: any) {
                             setError(err.message || 'Failed to update job interests');
                           } finally {
                             setLoading(false);
                           }
                         }}
                         disabled={loading}
                         className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
                       >
                         {loading ? (
                           <>
                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                             Saving...
                           </>
                         ) : (
                           <>
                             <CheckIcon className="h-4 w-4 mr-2" />
                             Save Changes
                           </>
                         )}
                       </button>
                    </div>
                  </div>
                                 ) : (
                   <div className="space-y-4">
                     <p className="text-sm text-gray-600">
                       You have selected {preferredCategories.length} job categories.
                     </p>
                     
                     {preferredCategories.length > 0 ? (
                       <div className="flex flex-wrap gap-2">
                         {preferredCategories.map((categoryId) => {
                           const category = jobCategories.find(cat => cat.id === categoryId || cat.id === String(categoryId));
                           return (
                             <span
                               key={categoryId}
                               className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                             >
                               {category?.name || 'Unknown Category'}
                             </span>
                           );
                         })}
                       </div>
                     ) : (
                       <div className="text-center py-8">
                         <TagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                         <p className="text-gray-500 mb-4">No job interests selected yet</p>
                         <button
                           onClick={() => {
                             setEditingJobInterests(true);
                             setTempSelectedCategories([]);
                           }}
                           className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                         >
                           Add your job interests
                         </button>
                       </div>
                     )}
                   </div>
                                 )}
               </div>
             </motion.div>
           )}

          {activeTab === 'education' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <AcademicCapIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Education</h3>
                </div>
              </div>
              <div className="p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Education Background
                  </label>
                  <textarea
                    name="education"
                    value={formData.education}
                    onChange={handleInputChange}
                    disabled={!editing}
                    rows={6}
                    placeholder="Enter your educational background, degrees, certifications, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'resume' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <DocumentTextIcon className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Resume Management</h3>
                </div>
              </div>
              <div className="p-6">
                {/* Resume Selection for Profile */}
                {userResumes.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Select Resume for Profile</h4>
                    <div className="space-y-3">
                      {userResumes.map((resume) => (
                        <div 
                          key={resume.id} 
                          className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            selectedResumeId === resume.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={() => handleResumeSelection(resume.id)}
                        >
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="selectedResume"
                              checked={selectedResumeId === resume.id}
                              onChange={() => handleResumeSelection(resume.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-3 ml-3" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{resume.original_filename}</p>
                              <p className="text-xs text-gray-500">
                                {resume.file_size_display} • {resume.parsing_status_display}
                                {resume.confidence_score && ` • ${Math.round(resume.confidence_score * 100)}% confidence`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {resume.is_primary && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                Primary
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(resume.file_url, '_blank');
                              }}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 flex space-x-3">
                      <button
                        onClick={() => handleSetPrimaryResume(selectedResumeId)}
                        disabled={!selectedResumeId || loading}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        Set as Primary
                      </button>
                      <button
                        onClick={() => handleDeleteResume(selectedResumeId)}
                        disabled={!selectedResumeId || loading}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        Delete Selected
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload new resume */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {userResumes.length > 0 ? 'Upload another resume' : 'Upload your resume'}
                  </h3>
                  <p className="text-gray-600 mb-4">PDF, DOC, or DOCX files accepted (max 10MB)</p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    disabled={loading}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label
                    htmlFor="resume-upload"
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg cursor-pointer inline-flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <CameraIcon className="h-4 w-4 mr-2" />
                        Choose File
                      </>
                    )}
                  </label>
                </div>

                {/* Resume Status Summary */}
                {userResumes.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Resume Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Resumes:</span>
                        <span className="ml-2 font-medium">{userResumes.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Primary Resume:</span>
                        <span className="ml-2 font-medium">
                          {userResumes.find(r => r.is_primary)?.original_filename || 'None'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Selected for Profile:</span>
                        <span className="ml-2 font-medium">
                          {userResumes.find(r => r.id === selectedResumeId)?.original_filename || 'None'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

              {activeTab === 'settings' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <CogIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Account Type</h4>
                        <p className="text-sm text-gray-500">Your account classification</p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                        {user?.user_type || 'Job Seeker'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Account Status</h4>
                        <p className="text-sm text-gray-500">Current account status</p>
                      </div>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                        {user?.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Email Verification</h4>
                        <p className="text-sm text-gray-500">Email verification status</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user?.is_verified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user?.is_verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Member Since</h4>
                        <p className="text-sm text-gray-500">Account creation date</p>
                      </div>
                      <span className="text-gray-600 text-sm">
                        {user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage; 