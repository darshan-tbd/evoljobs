import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import GoogleIntegrationComponent from '../components/GoogleIntegration';
import {
  HomeIcon,
  CogIcon,
  LinkIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  PlayIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  StarIcon,
  ArrowRightIcon,
  RocketLaunchIcon,
  SparklesIcon,
  BoltIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const GoogleIntegrationPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  const handleBreadcrumbClick = (path: string) => {
    router.push(path);
  };

  if (!isAuthenticated) {
  return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">Please log in to access Google Integration.</p>
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
    { id: 'overview', name: 'Overview', icon: HomeIcon },
    { id: 'integration', name: 'Integration', icon: LinkIcon },
    { id: 'features', name: 'Features', icon: SparklesIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon }
  ];

  const features = [
    {
      icon: BoltIcon,
      title: 'Automated Applications',
      description: 'Send job applications automatically based on your criteria',
      color: 'text-blue-600'
    },
    {
      icon: EnvelopeIcon,
      title: 'Gmail Integration',
      description: 'Seamlessly integrate with your Gmail account for professional applications',
      color: 'text-green-600'
    },
    {
      icon: ChartBarIcon,
      title: 'Response Tracking',
      description: 'Monitor and track responses from employers in real-time',
      color: 'text-purple-600'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure & Private',
      description: 'Enterprise-grade security with encrypted token storage',
      color: 'text-orange-600'
    }
  ];

  const benefits = [
    'Save 10+ hours per week on job applications',
    'Apply to 50+ jobs daily automatically',
    'Never miss application deadlines',
    'Professional email templates',
    'Real-time response notifications',
    'Detailed analytics and insights'
  ];

  const securityFeatures = [
    'All OAuth tokens encrypted with AES-256',
    'Industry-standard security protocols',
    'Only access Gmail for job applications',
    'Never store your Google credentials',
    'Revoke access anytime from this page',
    'SOC 2 Type II compliance'
  ];

  const steps = [
    { step: '1', title: 'Connect Your Account', desc: 'Secure OAuth 2.0 authentication with Google' },
    { step: '2', title: 'Configure Filters', desc: 'Set job criteria and preferences' },
    { step: '3', title: 'Enable Auto-Apply', desc: 'Activate automated applications' },
    { step: '4', title: 'Monitor Responses', desc: 'Track and manage employer replies' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">10x</p>
                    <p className="text-gray-600">Faster Applications</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <StarIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">98%</p>
                    <p className="text-gray-600">Success Rate</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <ClockIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">10h</p>
                    <p className="text-gray-600">Time Saved Weekly</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <RocketLaunchIcon className="h-6 w-6 text-blue-600 mr-2" />
                  Why Choose Google Integration?
                </h3>
                <ul className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <PlayIcon className="h-6 w-6 text-purple-600 mr-2" />
                  How It Works
                </h3>
                <div className="space-y-4">
                  {steps.map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {item.step}
                      </div>
                      <div className="ml-4">
                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                        <p className="text-gray-600 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'integration':
        return (
          <motion.div 
            key="integration"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
          <GoogleIntegrationComponent />
          </motion.div>
        );

      case 'features':
        return (
          <motion.div 
            key="features"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex items-start">
                    <div className={`p-3 rounded-lg bg-gray-50`}>
                      <feature.icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case 'security':
        return (
          <motion.div 
            key="security"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">Security & Privacy</h3>
                  <p className="text-yellow-700">
                    Your security is our top priority. We implement industry-leading security measures to protect your data.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <ShieldCheckIcon className="h-6 w-6 text-green-600 mr-2" />
                Security Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {securityFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start">
                <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Compliance & Certifications</h3>
                  <p className="text-green-700">
                    We maintain SOC 2 Type II compliance and follow GDPR guidelines for data protection.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumbs */}
            <nav className="flex mb-6" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4">
                <li>
                  <button
                    onClick={() => handleBreadcrumbClick('/')}
                    className="text-gray-400 hover:text-gray-500 flex items-center"
                  >
                    <HomeIcon className="h-5 w-5 mr-1" />
                    Home
                  </button>
                </li>
                <li>
                  <div className="flex items-center">
                    <ArrowRightIcon className="h-5 w-5 text-gray-400 mx-2" />
                    <button
                      onClick={() => handleBreadcrumbClick('/settings')}
                      className="text-gray-400 hover:text-gray-500 flex items-center"
                    >
                      <CogIcon className="h-5 w-5 mr-1" />
                      Settings
                    </button>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <ArrowRightIcon className="h-5 w-5 text-gray-400 mx-2" />
                    <span className="text-gray-900 flex items-center">
                      <LinkIcon className="h-5 w-5 mr-1" />
                      Google Integration
                    </span>
                  </div>
                </li>
              </ol>
            </nav>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Google Integration</h1>
                <p className="text-gray-600 mt-2">
                  Supercharge your job search with automated applications through Gmail API
                </p>
              </div>
              <div className="flex space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <StarIcon className="h-4 w-4 mr-1" />
                  Premium Feature
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <ShieldCheckIcon className="h-4 w-4 mr-1" />
                  Secure
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderTabContent()}
        </div>
      </div>
      </Layout>
  );
};

export default GoogleIntegrationPage; 