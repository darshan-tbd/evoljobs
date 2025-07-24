import React from 'react';
import { motion } from 'framer-motion';
import { 
  BriefcaseIcon,
  UserGroupIcon,
  RocketLaunchIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';

const AboutPage: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <BriefcaseIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                About JobPilot
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We're revolutionizing the job search experience with AI-powered matching 
                and a user-friendly platform designed for modern professionals.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Our Mission
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  At JobPilot, we believe that finding the right job should be effortless and intelligent. 
                  Our mission is to connect talented professionals with their dream opportunities through 
                  cutting-edge AI technology and a seamless user experience.
                </p>
                <p className="text-lg text-gray-600">
                  We're committed to making job search more efficient, personalized, and successful 
                  for both job seekers and employers.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8"
              >
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <UserGroupIcon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">10K+</h3>
                    <p className="text-sm text-gray-600">Active Users</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <BriefcaseIcon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">5K+</h3>
                    <p className="text-sm text-gray-600">Job Listings</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <RocketLaunchIcon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">95%</h3>
                    <p className="text-sm text-gray-600">Success Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <SparklesIcon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">24/7</h3>
                    <p className="text-sm text-gray-600">AI Support</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Our Values
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                The principles that guide everything we do at JobPilot.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Innovation',
                  description: 'We constantly push the boundaries of what is possible in job search technology.',
                  icon: SparklesIcon,
                  color: 'bg-blue-500'
                },
                {
                  title: 'User-Centric',
                  description: 'Every feature is designed with our users needs and experience in mind.',
                  icon: UserGroupIcon,
                  color: 'bg-green-500'
                },
                {
                  title: 'Excellence',
                  description: 'We strive for excellence in everything we do, from code to customer service.',
                  icon: RocketLaunchIcon,
                  color: 'bg-purple-500'
                }
              ].map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white rounded-lg p-6 shadow-sm"
                >
                  <div className={`w-12 h-12 ${value.color} rounded-lg flex items-center justify-center mb-4`}>
                    <value.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Join JobPilot?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Start your journey towards your dream career with our AI-powered platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => window.location.href = '/register'}
                  className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  Get Started
                </button>
                <button
                  onClick={() => window.location.href = '/jobs'}
                  className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-all duration-200"
                >
                  Browse Jobs
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default AboutPage; 