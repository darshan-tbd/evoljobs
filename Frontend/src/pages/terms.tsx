import React from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentTextIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';

const TermsPage: React.FC = () => {
  const sections = [
    {
      title: "Acceptance of Terms",
      content: `By accessing and using JobPilot ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`
    },
    {
      title: "Use License",
      content: `Permission is granted to temporarily download one copy of the materials on JobPilot for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
      
• Modify or copy the materials
• Use the materials for any commercial purpose or for any public display
• Attempt to reverse engineer any software contained on JobPilot's website
• Remove any copyright or other proprietary notations from the materials`
    },
    {
      title: "User Accounts",
      content: `When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account. You agree not to disclose your password to any third party.`
    },
    {
      title: "Job Applications and Services",
      content: `JobPilot provides a platform to connect job seekers with employers. We do not guarantee job placement, interviews, or employment. All job applications are subject to the individual employer's hiring process and decisions. You acknowledge that:

• We are not responsible for the accuracy of job postings
• We do not control the hiring decisions of employers
• You apply to jobs at your own discretion and risk
• We may use AI and automated systems to match candidates with jobs`
    },
    {
      title: "User Conduct",
      content: `You agree not to use the Service to:

• Violate any local, state, national, or international law
• Transmit any material that is defamatory, offensive, or otherwise objectionable
• Impersonate any person or entity
• Interfere with or disrupt the Service or servers
• Attempt to gain unauthorized access to any portion of the Service
• Use automated systems to access the Service without permission`
    },
    {
      title: "Content and Intellectual Property",
      content: `The Service and its original content, features, and functionality are and will remain the exclusive property of JobPilot and its licensors. The Service is protected by copyright, trademark, and other laws. You retain rights to any content you submit, but grant us a license to use it in connection with the Service.`
    },
    {
      title: "Privacy Policy",
      content: `Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices regarding the collection and use of your personal information.`
    },
    {
      title: "Subscription and Payment Terms",
      content: `Some features of our Service may be provided for a fee. You will be charged in advance on a recurring basis for subscription services. If you do not cancel your subscription before the end of the current billing period, your subscription will automatically renew.`
    },
    {
      title: "Disclaimers",
      content: `The information on this website is provided on an "as is" basis. To the fullest extent permitted by law, JobPilot excludes all representations, warranties, conditions, and terms which may be implied by law. JobPilot will not be liable for any damages arising from the use of this website.`
    },
    {
      title: "Limitations of Liability",
      content: `In no event shall JobPilot or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on JobPilot's website, even if JobPilot or its authorized representative has been notified orally or in writing of the possibility of such damage.`
    },
    {
      title: "Termination",
      content: `We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.`
    },
    {
      title: "Governing Law",
      content: `These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.`
    },
    {
      title: "Changes to Terms",
      content: `We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.`
    }
  ];

  return (
    <Layout>
      {/* Header Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                <DocumentTextIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Please read these terms carefully before using JobPilot. 
              By using our service, you agree to these terms and conditions.
            </p>
            <div className="flex items-center justify-center mt-6 text-sm text-gray-500">
              <span>Last updated: December 2024</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Important Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-12 rounded-r-lg"
          >
            <div className="flex items-start">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Important Notice
                </h3>
                <p className="text-yellow-700">
                  These terms constitute a legally binding agreement between you and JobPilot. 
                  Please read them carefully and contact us if you have any questions.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Terms Sections */}
          <div className="space-y-12">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="prose prose-lg max-w-none"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3">
                    {index + 1}
                  </span>
                  {section.title}
                </h2>
                <div className="text-gray-700 leading-relaxed whitespace-pre-line pl-11">
                  {section.content}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16 bg-gray-50 rounded-2xl p-8 text-center"
          >
            <ShieldCheckIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Questions About These Terms?
            </h3>
            <p className="text-gray-600 mb-6">
              If you have any questions or concerns about these Terms of Service, 
              we're here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200"
              >
                Contact Us
              </a>
              <a
                href="mailto:legal@jobpilot.com"
                className="px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-200"
              >
                Email Legal Team
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default TermsPage;