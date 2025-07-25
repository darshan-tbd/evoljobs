import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import {
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  StarIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ChartBarIcon,
  ArrowRightIcon,
  SparklesIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  CogIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  plan_type: string;
  daily_application_limit: number;
  features: string[];
}

interface SubscriptionStatus {
  has_active_subscription: boolean;
  plan_name: string;
  plan_type: string;
  daily_limit: number;
  used_today: number;
  remaining_today: number;
  companies_applied_today: string[];
  subscription_end_date: string | null;
  days_remaining: number;
  is_expired: boolean;
  features: string[];
  price: number;
}

const SubscriptionPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      return;
    }
    fetchSubscriptionData();
  }, [isAuthenticated, router]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Fetch subscription status
      const statusResponse = await fetch('http://127.0.0.1:8000/api/v1/subscriptions/subscriptions/status/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setSubscriptionStatus(statusData);
      }

      // Fetch available plans
      const plansResponse = await fetch('http://127.0.0.1:8000/api/v1/subscriptions/plans/');
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setAvailablePlans(plansData.results || plansData);
      }
    } catch (err) {
      setError('Error fetching subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setUpgradeDialogOpen(true);
  };

  const confirmUpgrade = async () => {
    if (!selectedPlan) return;

    setUpgrading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Create subscription data
      const subscriptionData = {
        plan_id: selectedPlan.id,
        auto_renew: true
      };

      const response = await fetch('http://127.0.0.1:8000/api/v1/subscriptions/subscriptions/subscribe/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      });

      if (response.ok) {
        const result = await response.json();
        setUpgradeDialogOpen(false);
        setSelectedPlan(null);
        fetchSubscriptionData(); // Refresh data
        
        // Show success message
        setSuccessMessage(`Subscription upgraded successfully to ${selectedPlan.name}! You can now apply to ${selectedPlan.daily_application_limit} companies per day.`);
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        const errorData = await response.json();
        console.error('Subscription error:', errorData);
        setError(errorData.message || errorData.error || 'Failed to upgrade subscription');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setError('Error upgrading subscription. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  const getPlanTypeColor = (type: string) => {
    switch (type) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanTypeGradient = (type: string) => {
    switch (type) {
      case 'free': return 'from-gray-500 to-gray-600';
      case 'standard': return 'from-blue-500 to-blue-600';
      case 'premium': return 'from-purple-500 to-purple-600';
      case 'enterprise': return 'from-green-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading subscription information...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <CreditCardIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Subscription & Plans
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Choose the perfect plan for your job search needs and unlock premium features to accelerate your career growth.
              </p>
            </motion.div>
          </div>
        </section>

        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
                  <p className="text-red-800">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600"
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {successMessage && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-400 mr-2" />
                  <p className="text-green-800">{successMessage}</p>
                </div>
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="text-green-400 hover:text-green-600"
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Stats Cards */}
        {subscriptionStatus && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Current Plan</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{subscriptionStatus.plan_type.toUpperCase()}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <CreditCardIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Daily Usage</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{subscriptionStatus.used_today}/{subscriptionStatus.daily_limit}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                    <ChartBarIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Remaining</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{subscriptionStatus.remaining_today}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg">
                    <ClockIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Monthly Cost</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">${subscriptionStatus.price}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                    <CurrencyDollarIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          </section>
        )}

        {/* Tabs */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab(0)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 0
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Current Plan
                </button>
                <button
                  onClick={() => setActiveTab(1)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 1
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Available Plans
                </button>
                <button
                  onClick={() => setActiveTab(2)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 2
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Usage History
                </button>
              </nav>
            </div>

            <div className="p-8">
              {/* Current Plan Tab */}
              {activeTab === 0 && subscriptionStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{subscriptionStatus.plan_name}</h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPlanTypeColor(subscriptionStatus.plan_type)}`}>
                        {subscriptionStatus.plan_type.toUpperCase()}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab(1)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 flex items-center"
                    >
                      Upgrade Plan
                      <ArrowRightIcon className="w-5 h-5 ml-2" />
                    </button>
                  </div>

                  {/* Usage Progress */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">Daily Application Usage</h4>
                      <span className="text-sm text-gray-600">{subscriptionStatus.remaining_today} remaining today</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${(subscriptionStatus.used_today / subscriptionStatus.daily_limit) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mt-2">
                      <span>{subscriptionStatus.used_today} used</span>
                      <span>{subscriptionStatus.daily_limit} limit</span>
                    </div>
                  </div>

                  {/* Plan Features */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Plan Features</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {subscriptionStatus.features.map((feature, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.6, delay: index * 0.1 }}
                          className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                        >
                          <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                          <span className="text-gray-700">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Subscription Expiry */}
                  {subscriptionStatus.has_active_subscription && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <div className="flex items-center">
                        <ClockIcon className="w-6 h-6 text-blue-500 mr-3" />
                        <div>
                          <h4 className="font-semibold text-blue-900">Subscription Status</h4>
                          <p className="text-blue-700">
                            {subscriptionStatus.days_remaining > 0
                              ? `${subscriptionStatus.days_remaining} days remaining in your subscription`
                              : 'Your subscription has expired'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Available Plans Tab */}
              {activeTab === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-8"
                >
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h3>
                    <p className="text-gray-600">Select the plan that best fits your job search needs</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {availablePlans.map((plan, index) => (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        className={`relative bg-white rounded-2xl shadow-lg border-2 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 ${
                          subscriptionStatus?.plan_type === plan.plan_type
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {subscriptionStatus?.plan_type === plan.plan_type && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                              Current Plan
                            </span>
                          </div>
                        )}

                        <div className="text-center">
                          <div className={`w-12 h-12 bg-gradient-to-r ${getPlanTypeGradient(plan.plan_type)} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                            <CreditCardIcon className="w-6 h-6 text-white" />
                          </div>
                          
                          <h4 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h4>
                          
                          <div className="mb-4">
                            <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                            <span className="text-gray-600">/month</span>
                          </div>

                          <p className="text-sm text-gray-600 mb-4">{plan.description}</p>

                          <div className="mb-6">
                            <span className="text-lg font-semibold text-gray-900">{plan.daily_application_limit}</span>
                            <span className="text-gray-600"> companies per day</span>
                          </div>

                          <div className="space-y-3 mb-6">
                            {plan.features.slice(0, 4).map((feature, featureIndex) => (
                              <div key={featureIndex} className="flex items-center text-sm">
                                <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                                <span className="text-gray-700">{feature}</span>
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={() => handleUpgrade(plan)}
                            disabled={subscriptionStatus?.plan_type === plan.plan_type}
                            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                              subscriptionStatus?.plan_type === plan.plan_type
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700'
                            }`}
                          >
                            {subscriptionStatus?.plan_type === plan.plan_type ? 'Current Plan' : 'Choose Plan'}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Usage History Tab */}
              {activeTab === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ChartBarIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Usage History</h3>
                  <p className="text-gray-600 mb-6">Your daily application usage over the past 7 days</p>
                  <div className="bg-gray-50 rounded-xl p-8">
                    <p className="text-gray-500">Usage history charts coming soon...</p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {/* Upgrade Dialog */}
        {upgradeDialogOpen && selectedPlan && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-2xl bg-white">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-r ${getPlanTypeGradient(selectedPlan.plan_type)} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <CreditCardIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Upgrade to {selectedPlan.name}</h3>
                  <p className="text-gray-600">Unlock premium features and increase your daily application limit</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Monthly Price</span>
                    <span className="font-semibold text-gray-900">${selectedPlan.price}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Daily Applications</span>
                    <span className="font-semibold text-gray-900">{selectedPlan.daily_application_limit} companies</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <h4 className="font-semibold text-gray-900">Plan Features:</h4>
                  {selectedPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setUpgradeDialogOpen(false)}
                    disabled={upgrading}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmUpgrade}
                    disabled={upgrading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {upgrading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Upgrading...
                      </>
                    ) : (
                      'Confirm Upgrade'
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SubscriptionPage; 