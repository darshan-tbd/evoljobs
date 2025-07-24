import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';


interface LoadingScreenProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'admin' | 'minimal' | 'skeleton';
  showProgress?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading...', 
  size = 'md',
  variant = 'default',
  showProgress = false
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16',
    lg: 'h-24 w-24'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  };

  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center p-4">
        <div className={`animate-spin rounded-full border-2 border-gray-200 border-t-blue-600 ${sizeClasses[size]}`}></div>
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className="animate-pulse">
        <div className="space-y-4">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-8 bg-gray-200 rounded-lg w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded-lg w-24"></div>
          </div>
          
          {/* Stats grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="h-12 w-12 bg-gray-200 rounded-2xl"></div>
                </div>
                <div className="mt-6">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Chart skeleton */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="h-80 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          {/* Main spinner */}
          <div className={`animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 mx-auto mb-6 ${sizeClasses[size]}`}></div>
          
          {/* Message */}
          <h3 className={`text-gray-900 font-bold mb-2 ${textSizes[size]}`}>{message}</h3>
          <p className="text-gray-500 text-sm">Please wait while we load your data...</p>
          
          {/* Progress dots */}
          <div className="mt-6 flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
          </div>
          
          {/* Optional: Add a subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-50 -z-10"></div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className={`animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 mx-auto mb-6 ${sizeClasses[size]}`}></div>
        <h2 className={`text-gray-900 font-bold mb-2 ${textSizes[size]}`}>{message}</h2>
        <p className="text-gray-500 text-sm">Loading your content...</p>
        
        {/* Optional: Add a subtle animation */}
        <div className="mt-6 flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen; 