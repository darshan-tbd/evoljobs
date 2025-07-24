import React, { useState, useEffect } from 'react';
import {
  BuildingOfficeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  GlobeAltIcon,
  PhoneIcon,
  EnvelopeIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CalendarIcon,
  MapPinIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/admin_dashboard/AdminLayout';

interface Company {
  id: string;
  name: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  industry?: string;
  size?: string;
  founded_year?: number;
  is_verified: boolean;
  is_active: boolean;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  job_count: number;
  application_count: number;
}

interface CompanyStats {
  total_companies: number;
  verified_companies: number;
  featured_companies: number;
  company_sizes: {
    [key: string]: number;
  };
  recent_activity: {
    new_companies_today: number;
    new_companies_this_week: number;
    new_companies_this_month: number;
  };
}

const AdminCompaniesPage: React.FC = () => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterIndustry, setFilterIndustry] = useState<string>('all');
  const [filterSize, setFilterSize] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [pageSize] = useState(50); // Increased to show more companies per page
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', type: 'success' });

  const fetchCompanies = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`http://127.0.0.1:8000/api/v1/companies/admin-companies/?page=${page}&page_size=${pageSize}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }

      const data = await response.json();
      console.log('Company API Response:', data);
      setCompanies(data.results || []);
      setTotalCompanies(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / pageSize));
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message || 'Failed to load companies');
      setSnackbar({
        open: true,
        message: err.message || 'Failed to load companies',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/companies/admin-companies/stats/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch company stats:', error);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchStats();
  }, []);

  // Auto-hide snackbar after 5 seconds
  useEffect(() => {
    if (snackbar.open) {
      const timer = setTimeout(() => {
        setSnackbar({ ...snackbar, open: false });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.open]);

  const handleRefresh = async () => {
    await fetchCompanies(currentPage);
    await fetchStats();
    setSnackbar({
      open: true,
      message: 'Companies refreshed successfully!',
      type: 'success'
    });
  };

  const handlePageChange = (page: number) => {
    fetchCompanies(page);
  };

  const handleViewCompany = (company: Company) => {
    setSelectedCompany(company);
    setShowCompanyModal(true);
  };

  const handleToggleVerification = async (company: Company) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/companies/${company.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_verified: !company.is_verified }),
      });

      if (response.ok) {
        setCompanies(companies.map(comp => 
          comp.id === company.id ? { ...comp, is_verified: !comp.is_verified } : comp
        ));
        setSnackbar({
          open: true,
          message: `Company ${company.is_verified ? 'unverified' : 'verified'} successfully!`,
          type: 'success'
        });
      } else {
        throw new Error('Failed to update company verification status');
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update company verification status',
        type: 'error'
      });
    }
  };

  const handleToggleActive = async (company: Company) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/companies/${company.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !company.is_active }),
      });

      if (response.ok) {
        setCompanies(companies.map(comp => 
          comp.id === company.id ? { ...comp, is_active: !comp.is_active } : comp
        ));
        setSnackbar({
          open: true,
          message: `Company ${company.is_active ? 'deactivated' : 'activated'} successfully!`,
          type: 'success'
        });
      } else {
        throw new Error('Failed to update company active status');
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update company active status',
        type: 'error'
      });
    }
  };

  const handleDeleteCompany = async (company: Company) => {
    if (!confirm('Are you sure you want to delete this company?')) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/companies/${company.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        setCompanies(companies.filter(comp => comp.id !== company.id));
        setSnackbar({
          open: true,
          message: 'Company deleted successfully!',
          type: 'success'
        });
      } else {
        throw new Error('Failed to delete company');
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to delete company',
        type: 'error'
      });
    }
  };

  const getStatusColor = (isVerified: boolean, isActive: boolean) => {
    if (!isActive) return 'bg-red-100 text-red-800 border-red-200';
    if (isVerified) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getStatusText = (isVerified: boolean, isActive: boolean) => {
    if (!isActive) return 'Inactive';
    if (isVerified) return 'Verified';
    return 'Pending';
  };

  const getStatusIcon = (isVerified: boolean, isActive: boolean) => {
    if (!isActive) return <XCircleIcon className="w-4 h-4" />;
    if (isVerified) return <CheckCircleIcon className="w-4 h-4" />;
    return <ClockIcon className="w-4 h-4" />;
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'verified' && company.is_verified) ||
                         (filterStatus === 'pending' && !company.is_verified && company.is_active) ||
                         (filterStatus === 'inactive' && !company.is_active);
    
    const matchesIndustry = filterIndustry === 'all' || company.industry === filterIndustry;
    const matchesSize = filterSize === 'all' || company.size === filterSize;

    return matchesSearch && matchesStatus && matchesIndustry && matchesSize;
  });

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) {
      return '0';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading companies...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Company Management</h1>
            <p className="text-gray-600 mt-2 text-lg">Manage and monitor all registered companies.</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200"
            >
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              Refresh
            </button>
            <button className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Company
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Companies</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(stats.total_companies)}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                  <BuildingOfficeIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="mt-6 flex items-center text-sm">
                <span className="text-green-600 font-semibold">+{stats.recent_activity.new_companies_today}</span>
                <span className="text-gray-500 ml-2">new today</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Verified</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(stats.verified_companies)}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
                  <CheckCircleIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="mt-6 flex items-center text-sm">
                <span className="text-green-600 font-semibold">
                  {stats.total_companies > 0 ? ((stats.verified_companies / stats.total_companies) * 100).toFixed(1) : '0.0'}%
                </span>
                <span className="text-gray-500 ml-2">verification rate</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Featured</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(stats.featured_companies)}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                  <GlobeAltIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="mt-6 flex items-center text-sm">
                <span className="text-purple-600 font-semibold">
                  {stats.total_companies > 0 ? ((stats.featured_companies / stats.total_companies) * 100).toFixed(1) : '0.0'}%
                </span>
                <span className="text-gray-500 ml-2">featured rate</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">This Week</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(stats.recent_activity.new_companies_this_week)}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg">
                  <CalendarIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="mt-6 flex items-center text-sm">
                <span className="text-orange-600 font-semibold">+{stats.recent_activity.new_companies_today}</span>
                <span className="text-gray-500 ml-2">today</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200"
              >
                <FunnelIcon className="w-5 h-5 mr-2" />
                Filters
                {showFilters ? (
                  <ChevronUpIcon className="w-4 h-4 ml-2" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 ml-2" />
                )}
              </button>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                  <select
                    value={filterIndustry}
                    onChange={(e) => setFilterIndustry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Industries</option>
                    {Array.from(new Set(companies.map(comp => comp.industry).filter(Boolean))).map(industry => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                  <select
                    value={filterSize}
                    onChange={(e) => setFilterSize(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Sizes</option>
                    {Array.from(new Set(companies.map(comp => comp.size).filter(Boolean))).map(size => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Companies Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Companies ({totalCompanies} total, showing {companies.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jobs</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                          {company.logo_url ? (
                            <img src={company.logo_url} alt={company.name} className="w-8 h-8 rounded" />
                          ) : (
                            <BuildingOfficeIcon className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{company.name}</div>
                          <div className="text-sm text-gray-500">{company.city}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{company.user?.email || 'N/A'}</div>
                      {company.phone && (
                        <div className="text-sm text-gray-500">{company.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{company.industry || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{company.size || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(company.is_verified, company.is_active)}`}>
                        {getStatusIcon(company.is_verified, company.is_active)}
                        <span className="ml-1">{getStatusText(company.is_verified, company.is_active)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{company.job_count} jobs</div>
                      <div className="text-sm text-gray-500">{company.application_count} applications</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(company.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewCompany(company)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleVerification(company)}
                          className={`p-2 rounded-lg transition-colors ${
                            company.is_verified 
                              ? 'text-yellow-600 hover:bg-yellow-100' 
                              : 'text-green-600 hover:bg-green-100'
                          }`}
                          title={company.is_verified ? 'Unverify' : 'Verify'}
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(company)}
                          className={`p-2 rounded-lg transition-colors ${
                            company.is_active 
                              ? 'text-red-600 hover:bg-red-100' 
                              : 'text-green-600 hover:bg-green-100'
                          }`}
                          title={company.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {company.is_active ? (
                            <XCircleIcon className="w-4 h-4" />
                          ) : (
                            <CheckCircleIcon className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteCompany(company)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredCompanies.length === 0 && (
            <div className="text-center py-12">
              <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, totalCompanies)}
                </span>{' '}
                of <span className="font-medium">{totalCompanies}</span> companies
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Company Statistics */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Company Sizes</h3>
              <div className="space-y-4">
                {stats.company_sizes && Object.keys(stats.company_sizes).length > 0 ? (
                  Object.entries(stats.company_sizes)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 5)
                    .map(([size, count]) => (
                      <div key={size} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-blue-500 rounded-full mr-4"></div>
                          <span className="text-gray-700 font-medium">{size}</span>
                        </div>
                        <span className="font-bold text-lg text-gray-900">{count}</span>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8">
                    <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No industry data available</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Company Sizes</h3>
              <div className="space-y-4">
                {stats.company_sizes && Object.keys(stats.company_sizes).length > 0 ? (
                  Object.entries(stats.company_sizes)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 5)
                    .map(([size, count]) => (
                      <div key={size} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-purple-500 rounded-full mr-4"></div>
                          <span className="text-gray-700 font-medium">{size}</span>
                        </div>
                        <span className="font-bold text-lg text-gray-900">{count}</span>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8">
                    <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No company size data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Company Detail Modal */}
      {showCompanyModal && selectedCompany && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowCompanyModal(false)}></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Company Details</h3>
                  <button
                    onClick={() => setShowCompanyModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      {selectedCompany.logo_url ? (
                        <img src={selectedCompany.logo_url} alt={selectedCompany.name} className="w-10 h-10 rounded" />
                      ) : (
                        <BuildingOfficeIcon className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-semibold text-gray-900">{selectedCompany.name}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedCompany.is_verified, selectedCompany.is_active)}`}>
                        {getStatusIcon(selectedCompany.is_verified, selectedCompany.is_active)}
                        <span className="ml-1">{getStatusText(selectedCompany.is_verified, selectedCompany.is_active)}</span>
                      </span>
                    </div>
                  </div>
                  
                  {selectedCompany.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <p className="text-sm text-gray-900">{selectedCompany.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                      <p className="text-sm text-gray-900">{selectedCompany.industry || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                      <p className="text-sm text-gray-900">{selectedCompany.size || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <p className="text-sm text-gray-900">
                      {selectedCompany.user?.first_name || 'N/A'} {selectedCompany.user?.last_name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">{selectedCompany.user?.email || 'N/A'}</p>
                  </div>
                  
                  {selectedCompany.website && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800">
                        {selectedCompany.website}
                      </a>
                    </div>
                  )}
                  
                  {selectedCompany.address && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <p className="text-sm text-gray-900">{selectedCompany.address}</p>
                      <p className="text-sm text-gray-500">
                        {selectedCompany.city}, {selectedCompany.state} {selectedCompany.country}
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Jobs Posted</label>
                      <p className="text-sm text-gray-900">{selectedCompany.job_count}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Applications</label>
                      <p className="text-sm text-gray-900">{selectedCompany.application_count}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Joined</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedCompany.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 flex justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleToggleVerification(selectedCompany)}
                    className={`px-4 py-2 rounded-xl transition-colors ${
                      selectedCompany.is_verified 
                        ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {selectedCompany.is_verified ? 'Unverify' : 'Verify'}
                  </button>
                  <button
                    onClick={() => handleToggleActive(selectedCompany)}
                    className={`px-4 py-2 rounded-xl transition-colors ${
                      selectedCompany.is_active 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {selectedCompany.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
                <button
                  onClick={() => setShowCompanyModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar */}
      {snackbar.open && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-xl shadow-2xl border-l-4 transform transition-all duration-300 ease-in-out ${
          snackbar.type === 'success' ? 'border-green-500' : 
          snackbar.type === 'error' ? 'border-red-500' : 
          snackbar.type === 'warning' ? 'border-yellow-500' : 'border-blue-500'
        }`}>
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {snackbar.type === 'success' && (
                  <CheckCircleIcon className="w-6 h-6 text-green-500" />
                )}
                {snackbar.type === 'error' && (
                  <XCircleIcon className="w-6 h-6 text-red-500" />
                )}
                {snackbar.type === 'warning' && (
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />
                )}
                {snackbar.type === 'info' && (
                  <InformationCircleIcon className="w-6 h-6 text-blue-500" />
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className={`text-sm font-medium ${
                  snackbar.type === 'success' ? 'text-green-800' : 
                  snackbar.type === 'error' ? 'text-red-800' : 
                  snackbar.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'
                }`}>
                  {snackbar.message}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => setSnackbar({ ...snackbar, open: false })}
                  className={`inline-flex rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    snackbar.type === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-500' : 
                    snackbar.type === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-500' : 
                    snackbar.type === 'warning' ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-500' : 
                    'text-blue-500 hover:bg-blue-100 focus:ring-blue-500'
                  }`}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCompaniesPage; 