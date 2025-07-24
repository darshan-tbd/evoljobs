import React from 'react';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  UserIcon,
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

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: User | null;
  loading?: boolean;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  user,
  loading = false
}) => {
  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Delete User</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Warning Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* User Info */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                <UserIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">
                  {user.first_name} {user.last_name}
                </h3>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-red-800 mb-2">Warning</h4>
            <p className="text-red-700 text-sm">
              Are you sure you want to delete this user? This action cannot be undone and will permanently remove:
            </p>
            <ul className="text-red-700 text-sm mt-2 space-y-1">
              <li>• User account and all associated data</li>
              <li>• Profile information and preferences</li>
              <li>• Any applications or job postings</li>
              <li>• Account history and activity</li>
            </ul>
          </div>

          {/* Additional Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">User Type:</span>
                <p className="font-medium text-gray-900 capitalize">
                  {user.user_type.replace('_', ' ')}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <p className={`font-medium ${
                  user.is_active ? 'text-green-600' : 'text-red-600'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Joined:</span>
                <p className="font-medium text-gray-900">
                  {new Date(user.date_joined).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Last Login:</span>
                <p className="font-medium text-gray-900">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dialog Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Deleting...' : 'Delete User'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationDialog; 