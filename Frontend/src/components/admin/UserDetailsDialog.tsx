import React from 'react';
import {
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BriefcaseIcon,
  CalendarIcon,
  ClockIcon,
  CheckBadgeIcon,
  NoSymbolIcon,
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

interface UserDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({
  open,
  onClose,
  user
}) => {
  if (!open || !user) return null;

  const getUserTypeLabel = (userType: string) => {
    const types = {
      job_seeker: 'Job Seeker',
      employer: 'Employer',
      admin: 'Admin',
    };
    return types[userType as keyof typeof types] || userType;
  };

  const getExperienceLevelLabel = (level: string) => {
    const levels = {
      entry_level: 'Entry Level',
      mid_level: 'Mid Level',
      senior_level: 'Senior Level',
      executive: 'Executive',
    };
    return levels[level as keyof typeof levels] || level;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Avatar and Basic Info */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {user.first_name} {user.last_name}
              </h3>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
                {user.is_verified && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <CheckBadgeIcon className="w-3 h-3 mr-1" />
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* User Type and Permissions */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <ShieldCheckIcon className="w-5 h-5 mr-2" />
              Account Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">User Type</label>
                <p className="text-gray-900 font-medium">{getUserTypeLabel(user.user_type)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Permissions</label>
                <div className="space-y-1">
                  {user.is_staff && (
                    <p className="text-sm text-gray-900">• Staff Member</p>
                  )}
                  {user.is_superuser && (
                    <p className="text-sm text-gray-900">• Superuser</p>
                  )}
                  {!user.is_staff && !user.is_superuser && (
                    <p className="text-sm text-gray-500">Standard User</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <EnvelopeIcon className="w-5 h-5 mr-2" />
              Contact Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              {user.profile?.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <p className="text-gray-900">{user.profile.phone}</p>
                </div>
              )}
              {user.profile?.location_text && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="text-gray-900">{user.profile.location_text}</p>
                </div>
              )}
            </div>
          </div>

          {/* Professional Information */}
          {(user.profile?.current_job_title || user.profile?.experience_level) && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <BriefcaseIcon className="w-5 h-5 mr-2" />
                Professional Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.profile?.current_job_title && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Job Title</label>
                    <p className="text-gray-900">{user.profile.current_job_title}</p>
                  </div>
                )}
                {user.profile?.experience_level && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Experience Level</label>
                    <p className="text-gray-900">{getExperienceLevelLabel(user.profile.experience_level)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Timestamps */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              Account Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date Joined</label>
                <p className="text-gray-900">{formatDate(user.date_joined)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Login</label>
                <p className="text-gray-900">
                  {user.last_login ? formatDate(user.last_login) : 'Never'}
                </p>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Account Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                {user.is_active ? (
                  <CheckBadgeIcon className="w-5 h-5 text-green-600" />
                ) : (
                  <NoSymbolIcon className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-medium ${
                  user.is_active ? 'text-green-600' : 'text-red-600'
                }`}>
                  {user.is_active ? 'Account Active' : 'Account Inactive'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {user.is_verified ? (
                  <CheckBadgeIcon className="w-5 h-5 text-blue-600" />
                ) : (
                  <NoSymbolIcon className="w-5 h-5 text-yellow-600" />
                )}
                <span className={`font-medium ${
                  user.is_verified ? 'text-blue-600' : 'text-yellow-600'
                }`}>
                  {user.is_verified ? 'Email Verified' : 'Email Not Verified'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dialog Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsDialog; 