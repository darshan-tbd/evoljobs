import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheckIcon,
  EyeIcon,
  CogIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';

const PrivacyPage: React.FC = () => {
  const sections = [
    {
      icon: EyeIcon,
      title: "Information We Collect",
      content: `We collect information you provide directly to us, such as when you create an account, complete your profile, apply for jobs, or contact us. This includes:

• Personal information (name, email address, phone number, location)
• Professional information (work experience, education, skills, resume)
• Account information (username, password, preferences)
• Communication data (messages, support requests)
• Usage data (how you interact with our platform)
• Device information (IP address, browser type, operating system)`
    },
    {
      icon: CogIcon,
      title: "How We Use Your Information",
      content: `We use the information we collect to:

• Provide, maintain, and improve our services
• Create and manage your account
• Match you with relevant job opportunities
• Enable communication between job seekers and employers
• Send you important updates and notifications
• Provide customer support
• Analyze usage patterns to improve our platform
• Comply with legal obligations
• Prevent fraud and ensure platform security`
    },
    {
      icon: GlobeAltIcon,
      title: "Information Sharing and Disclosure",
      content: `We may share your information in the following circumstances:

• With employers when you apply for jobs or express interest
• With service providers who help us operate our platform
• When required by law or to protect our rights
• In connection with a business transaction (merger, acquisition)
• With your explicit consent

We do not sell your personal information to third parties for marketing purposes. When sharing with employers, we only share relevant professional information necessary for the job application process.`
    },
    {
      icon: LockClosedIcon,
      title: "Data Security",
      content: `We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:

• Encryption of sensitive data in transit and at rest
• Regular security assessments and audits
• Access controls and authentication systems
• Employee training on data protection
• Incident response procedures

However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.`
    },
    {
      title: "Data Retention",
      content: `We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. Specifically:

• Account information: Retained while your account is active
• Job application data: Retained for legitimate business purposes
• Communication records: Retained for customer service purposes
• Usage data: Typically retained for 2-3 years for analytics

You may request deletion of your account and associated data at any time, subject to legal retention requirements.`
    },
    {
      title: "Your Rights and Choices",
      content: `Depending on your location, you may have the following rights regarding your personal information:

• Access: Request a copy of your personal data
• Rectification: Correct inaccurate or incomplete data
• Erasure: Request deletion of your data
• Portability: Receive your data in a portable format
• Restriction: Limit how we process your data
• Objection: Object to certain processing activities
• Withdraw consent: Revoke previously given consent

To exercise these rights, please contact us at privacy@jobpilot.com.`
    },
    {
      title: "Cookies and Tracking Technologies",
      content: `We use cookies and similar technologies to:

• Remember your preferences and settings
• Analyze how you use our platform
• Provide personalized job recommendations
• Ensure platform security and prevent fraud
• Enable social media features

You can control cookie settings through your browser, but disabling certain cookies may affect platform functionality.`
    },
    {
      title: "AI and Automated Processing",
      content: `We use artificial intelligence and automated systems to:

• Match job seekers with relevant opportunities
• Screen and rank job applications
• Provide personalized recommendations
• Detect and prevent fraudulent activity

If you are subject to automated decision-making that significantly affects you, you have the right to request human review of the decision.`
    },
    {
      title: "Third-Party Services",
      content: `Our platform may integrate with third-party services such as:

• Google services for authentication and integration
• Payment processors for subscription services
• Analytics providers for usage insights
• Communication tools for messaging

These third parties have their own privacy policies, and we encourage you to review them.`
    },
    {
      title: "International Data Transfers",
      content: `Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for international transfers, including:

• Adequacy decisions by relevant authorities
• Standard contractual clauses
• Binding corporate rules
• Certification schemes

We take steps to ensure your data receives adequate protection regardless of where it is processed.`
    },
    {
      title: "Children's Privacy",
      content: `Our services are not intended for individuals under the age of 16. We do not knowingly collect personal information from children under 16. If we learn that we have collected information from a child under 16, we will delete that information promptly.`
    },
    {
      title: "Changes to This Policy",
      content: `We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. We will notify you of material changes by:

• Posting the updated policy on our website
• Sending email notifications to registered users
• Providing prominent notice on our platform

Continued use of our services after changes constitutes acceptance of the updated policy.`
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
                <ShieldCheckIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
                         <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Your privacy is important to us. This policy explains how we collect, 
              use, and protect your personal information when you use JobPilot.
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
          {/* Privacy Commitment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-12 rounded-r-lg"
          >
            <div className="flex items-start">
              <LockClosedIcon className="w-6 h-6 text-blue-400 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  Our Privacy Commitment
                </h3>
                <p className="text-blue-700">
                  We are committed to protecting your privacy and being transparent about our data practices. 
                  This policy describes how we handle your information with care and respect.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Privacy Sections */}
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
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
                    {section.icon ? (
                      <section.icon className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-white text-sm font-bold">{index + 1}</span>
                    )}
                  </div>
                  {section.title}
                </h2>
                <div className="text-gray-700 leading-relaxed whitespace-pre-line pl-11">
                  {section.content}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Data Rights Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16 bg-gray-50 rounded-2xl p-8"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Quick Summary of Your Rights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Access & Control</h4>
                <p className="text-gray-600 text-sm">
                  You can access, update, or delete your personal information at any time.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Data Portability</h4>
                <p className="text-gray-600 text-sm">
                  You can export your data in a portable format if needed.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Opt-Out Options</h4>
                <p className="text-gray-600 text-sm">
                  You can opt out of marketing communications and certain data processing.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Support</h4>
                <p className="text-gray-600 text-sm">
                  Our privacy team is available to help with any questions or concerns.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-12 text-center"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Questions About Your Privacy?
            </h3>
            <p className="text-gray-600 mb-6">
              We're here to help you understand how we protect your information.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200"
              >
                Contact Us
              </a>
              <a
                href="mailto:privacy@jobpilot.com"
                className="px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-200"
              >
                Email Privacy Team
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default PrivacyPage;