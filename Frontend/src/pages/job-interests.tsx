/**
 * Choose Your Job Interests Page for JobPilot (EvolJobs.com)
 * Appears after Google sign-in account creation to let users select their job interests
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';
import LoadingScreen from '@/components/LoadingScreen';

interface JobCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
}

const JobInterestsPage: React.FC = () => {
  const router = useRouter();
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJobCategories();
  }, []);

  const fetchJobCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/jobs/job-categories/`);
      if (response.ok) {
        const data = await response.json();
        setJobCategories(data);
      } else {
        setError('Failed to load job categories');
      }
    } catch (err) {
      setError('Network error while loading job categories');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const savePreferences = async () => {
    if (selectedCategories.length === 0) {
      setError('Please select at least one job interest');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/users/profiles/update-preferences/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          preferred_job_categories: selectedCategories
        }),
      });

      if (response.ok) {
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save preferences');
      }
    } catch (err) {
      setError('Network error while saving preferences');
    } finally {
      setSaving(false);
    }
  };

  const skipForNow = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center">
                <BriefcaseIcon className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Job Interests
            </h1>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Help us personalize your job recommendations by selecting the types of roles you're interested in. 
              You can always update these preferences later.
            </p>
            
            <div className="flex items-center justify-center mt-6 text-sm text-gray-500">
              <SparklesIcon className="h-4 w-4 mr-2" />
              <span>Select multiple categories that match your interests</span>
            </div>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Job Categories Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {jobCategories.map((category, index) => (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleCategory(category.id)}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all duration-200 text-left
                    ${selectedCategories.includes(category.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-md'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-xs opacity-75 line-clamp-2">
                          {category.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Check indicator */}
                    <div className={`
                      ml-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200
                      ${selectedCategories.includes(category.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                      }
                    `}>
                      <AnimatePresence>
                        {selectedCategories.includes(category.id) && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <CheckIcon className="h-4 w-4 text-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Selection Counter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mb-8"
          >
            <p className="text-gray-600">
              {selectedCategories.length > 0 
                ? `${selectedCategories.length} ${selectedCategories.length === 1 ? 'category' : 'categories'} selected`
                : 'No categories selected yet'
              }
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={skipForNow}
              className="w-full sm:w-auto px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Skip for now
            </button>
            
            <button
              onClick={savePreferences}
              disabled={saving || selectedCategories.length === 0}
              className={`
                w-full sm:w-auto px-8 py-3 font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2
                ${saving || selectedCategories.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl'
                }
              `}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Continue to Dashboard</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </>
              )}
            </button>
          </motion.div>

          {/* Help Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mt-8"
          >
            <p className="text-sm text-gray-500">
              Don't worry! You can always change your job interests later in your profile settings.
            </p>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default JobInterestsPage; 