import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Users, 
  Building, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Eye,
  Settings,
  BarChart3,
  UserPlus,
  Package,
  CreditCard,
  Activity,
  Loader2,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  Target,
  Shield,
  TrendingDown,
  RefreshCw,
  Sparkles,
  X,
  AlertTriangle,
  UserX,
  Phone,
  Mail,
  Scissors,
  Home
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminStats {
  totalUsers: number;
  totalVendors: number;
  totalManagers: number;
  pendingApprovals: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayouts: number;
  refundRequests: number;
  activeUsers: number;
  suspendedUsers: number;
  activeVendors: number;
  pendingVendors: number;
  totalBookings: number;
  completedBookings: number;
  atHomeBookings: number;
  salonBookings: number;
  totalCommissions: number;
  pendingDisputes: number;
  averageRating: number;
  totalCatalogServices: number;
  activeCatalogServices: number;
  totalCatalogProducts: number;
  activeCatalogProducts: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registration' | 'vendor_approval' | 'booking_completed' | 'payment_processed' | 'dispute_created' | 'refund_processed' | 'manager_approval' | 'beautician_approval' | 'vendor_suspension' | 'user_suspension' | 'payment_failed' | 'booking_cancelled';
  description: string;
  timestamp: string;
  user?: {
    name: string;
    email: string;
    phone?: string;
  };
  vendor?: {
    name: string;
    businessName: string;
    email: string;
  };
  amount?: number;
  status?: 'success' | 'pending' | 'failed' | 'cancelled';
  bookingType?: string;
}


interface TopVendor {
  id: string;
  shopname: string;
  businessType: string;
  totalRevenue: number;
  totalBookings: number;
  averageRating: number;
  status: string;
}

interface PendingVendor {
  id: string;
  shopname: string;
  status: string;
  created_at: string;
  user: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

const AdminDashboard = () => {
  const { user } = useSupabaseAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [topVendors, setTopVendors] = useState<TopVendor[]>([]);
  const [pendingVendors, setPendingVendors] = useState<PendingVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingVendor, setProcessingVendor] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching admin dashboard data from backend API...');
      
      // Import adminApi dynamically to avoid circular dependencies
      const { adminApi } = await import('@/lib/adminApi');
      
      const result = await adminApi.getDashboard();
      
      if (!result.success) {
        console.error('❌ Admin API returned error:', result.message);
        throw new Error(result.message || 'Failed to load dashboard data');
      }

      if (!result.data) {
        console.error('❌ No data in API response:', result);
        throw new Error('No data received from API');
      }

      console.log('✅ Admin API response received:', result.data);

      const responseData = result.data;
      const statsData = responseData.stats || {};
      const recentActivityData = responseData.recentActivity || [];
      const pendingVendorsData = responseData.pendingVendors || [];

      // Set stats
      setStats({
        totalUsers: statsData.totalUsers || 0,
        totalVendors: statsData.totalVendors || 0,
        totalManagers: statsData.totalManagers || 0,
        pendingApprovals: statsData.pendingApprovals || 0,
        totalRevenue: statsData.totalRevenue || 0,
        monthlyRevenue: statsData.monthlyRevenue || 0,
        pendingPayouts: statsData.pendingPayouts || 0,
        refundRequests: statsData.refundRequests || 0,
        activeUsers: statsData.activeUsers || 0,
        suspendedUsers: statsData.suspendedUsers || 0,
        activeVendors: statsData.activeVendors || 0,
        pendingVendors: statsData.pendingVendors || 0,
        totalBookings: statsData.totalBookings || 0,
        completedBookings: statsData.completedBookings || 0,
        atHomeBookings: statsData.atHomeBookings || 0,
        salonBookings: statsData.salonBookings || 0,
        totalCommissions: statsData.totalCommissions || 0,
        pendingDisputes: statsData.pendingDisputes || 0,
        averageRating: statsData.averageRating || 0,
        totalCatalogServices: statsData.totalCatalogServices || 0,
        activeCatalogServices: statsData.activeCatalogServices || 0,
        totalCatalogProducts: statsData.totalCatalogProducts || 0,
        activeCatalogProducts: statsData.activeCatalogProducts || 0
      });

      // Set pending vendors
      setPendingVendors(pendingVendorsData);

      // Set recent activity
      setRecentActivity(recentActivityData);

      console.log('✅ Admin dashboard data loaded successfully');
      toast.success('Admin dashboard data loaded successfully');
    } catch (error: any) {
      console.error('❌ Error loading admin dashboard data:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      });
      
      // Show user-friendly error message
      if (error.message?.includes('JWT') || error.message?.includes('token') || error.message?.includes('unauthorized')) {
        toast.error('Authentication error. Please log in again.');
      } else if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('Unable to connect')) {
        toast.error('Network error. Please ensure the backend server is running on port 3001.');
      } else {
        toast.error(`Failed to load dashboard data: ${error.message || 'Unknown error'}. Check browser console for details.`);
      }
      
      // Set empty stats to prevent crashes
      setStats({
        totalUsers: 0,
        totalVendors: 0,
        totalManagers: 0,
        pendingApprovals: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        pendingPayouts: 0,
        refundRequests: 0,
        activeUsers: 0,
        suspendedUsers: 0,
        activeVendors: 0,
        pendingVendors: 0,
        totalBookings: 0,
        completedBookings: 0,
        atHomeBookings: 0,
        salonBookings: 0,
        totalCommissions: 0,
        pendingDisputes: 0,
        averageRating: 0,
        totalCatalogServices: 0,
        activeCatalogServices: 0,
        totalCatalogProducts: 0,
        activeCatalogProducts: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // NOTE: Admin dashboard now fetches data directly from Supabase for real-time updates

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return <UserPlus className="w-4 h-4 text-white" />;
      case 'vendor_approval':
        return <Building className="w-4 h-4 text-white" />;
      case 'booking_completed':
        return <CheckCircle className="w-4 h-4 text-white" />;
      case 'booking_cancelled':
        return <X className="w-4 h-4 text-white" />;
      case 'payment_processed':
        return <CreditCard className="w-4 h-4 text-white" />;
      case 'payment_failed':
        return <AlertTriangle className="w-4 h-4 text-white" />;
      case 'refund_processed':
        return <RefreshCw className="w-4 h-4 text-white" />;
      case 'dispute_created':
        return <AlertCircle className="w-4 h-4 text-white" />;
      case 'manager_approval':
      case 'beautician_approval':
        return <UserCheck className="w-4 h-4 text-white" />;
      case 'vendor_suspension':
        return <Building className="w-4 h-4 text-white" />;
      case 'user_suspension':
        return <UserX className="w-4 h-4 text-white" />;
      default:
        return <Activity className="w-4 h-4 text-white" />;
    }
  };

  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const handleVendorAction = async (vendorId: string, action: 'APPROVED' | 'REJECTED') => {
    if (processingVendor === vendorId) return;
    
    try {
      setProcessingVendor(vendorId);
      
      // Import adminApi dynamically
      const { adminApi } = await import('@/lib/adminApi');
      
      const result = await adminApi.updateVendorStatus(vendorId, action);

      if (!result.success) {
        throw new Error(result.message || `Failed to ${action === 'APPROVED' ? 'approve' : 'reject'} vendor`);
      }

      toast.success(`Vendor ${action === 'APPROVED' ? 'approved' : 'rejected'} successfully`);
      
      // Refresh data
      await fetchAdminData();
    } catch (error: any) {
      console.error(`Error ${action === 'APPROVED' ? 'approving' : 'rejecting'} vendor:`, error);
      toast.error(`Failed to ${action === 'APPROVED' ? 'approve' : 'reject'} vendor: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessingVendor(null);
    }
  };


  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading admin dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-[#4e342e] mb-2">Admin Dashboard</h1>
              <p className="text-[#6d4c41]">Welcome back, {user?.firstName}! Here's your platform overview.</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white"
                onClick={fetchAdminData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6d4c41]">Total Users</p>
                    <p className="text-2xl font-bold text-[#4e342e]">{stats.totalUsers.toLocaleString()}</p>
                    <div className="flex items-center mt-2">
                      <Badge className="bg-[#f8d7da]/30 text-[#4e342e] text-xs">
                        {stats.activeUsers} Active
                      </Badge>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6d4c41]">Total Vendors</p>
                    <p className="text-2xl font-bold text-[#4e342e]">{stats.totalVendors.toLocaleString()}</p>
                    <div className="flex items-center mt-2">
                      <Badge className="bg-[#6d4c41]/20 text-[#6d4c41] text-xs">
                        {stats.pendingVendors} Pending
                      </Badge>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6d4c41]">Total Managers</p>
                    <p className="text-2xl font-bold text-[#4e342e]">{stats.totalManagers.toLocaleString()}</p>
                    <div className="flex items-center mt-2">
                      <Badge className="bg-[#f8d7da]/30 text-[#4e342e] text-xs">
                        {stats.totalManagers} Active
                      </Badge>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6d4c41]">Total Revenue</p>
                    <p className="text-2xl font-bold text-[#4e342e]">${stats.totalRevenue.toLocaleString()}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-4 h-4 text-[#6d4c41] mr-1" />
                      <span className="text-sm text-[#6d4c41]">${stats.monthlyRevenue} this month</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Additional Stats Row */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6d4c41]">Pending Approvals</p>
                    <p className="text-2xl font-bold text-[#4e342e]">{stats.pendingApprovals}</p>
                    <div className="flex items-center mt-2">
                      <Badge className="bg-[#6d4c41]/20 text-[#6d4c41] text-xs">
                        Requires Action
                      </Badge>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6d4c41]">Total Bookings</p>
                    <p className="text-2xl font-bold text-[#4e342e]">{stats.totalBookings.toLocaleString()}</p>
                    <div className="flex items-center mt-2">
                      <CheckCircle className="w-4 h-4 text-[#6d4c41] mr-1" />
                      <span className="text-sm text-[#6d4c41]">{stats.completedBookings} completed</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6d4c41]">Pending Payouts</p>
                    <p className="text-2xl font-bold text-[#4e342e]">${stats.pendingPayouts.toLocaleString()}</p>
                    <div className="flex items-center mt-2">
                      <Badge className="bg-[#6d4c41]/20 text-[#6d4c41] text-xs">
                        Awaiting Approval
                      </Badge>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6d4c41]">Refund Requests</p>
                    <p className="text-2xl font-bold text-[#4e342e]">{stats.refundRequests}</p>
                    <div className="flex items-center mt-2">
                      <Badge className="bg-[#6d4c41]/20 text-[#6d4c41] text-xs">
                        Needs Review
                      </Badge>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Catalog Stats Row */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6d4c41]">Catalog Services</p>
                    <p className="text-2xl font-bold text-[#4e342e]">{stats.totalCatalogServices}</p>
                    <div className="flex items-center mt-2">
                      <Badge className="bg-green-500 text-white text-xs">
                        {stats.activeCatalogServices} Active
                      </Badge>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                    <Scissors className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6d4c41]">Catalog Products</p>
                    <p className="text-2xl font-bold text-[#4e342e]">{stats.totalCatalogProducts}</p>
                    <div className="flex items-center mt-2">
                      <Badge className="bg-green-500 text-white text-xs">
                        {stats.activeCatalogProducts} Active
                      </Badge>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6d4c41]">At-Home Bookings</p>
                    <p className="text-2xl font-bold text-[#4e342e]">{stats.atHomeBookings}</p>
                    <div className="flex items-center mt-2">
                      <Badge className="bg-[#f8d7da]/30 text-[#4e342e] text-xs">
                        {stats.completedBookings} Completed
                      </Badge>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                    <Home className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6d4c41]">Salon Bookings</p>
                    <p className="text-2xl font-bold text-[#4e342e]">{stats.salonBookings}</p>
                    <div className="flex items-center mt-2">
                      <Badge className="bg-[#f8d7da]/30 text-[#4e342e] text-xs">
                        Salon Visits
                      </Badge>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions - Pending Vendors */}
        {pendingVendors.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-serif font-bold text-[#4e342e]">Pending Vendor Approvals</h2>
              <Link to="/admin/vendors?status=PENDING">
                <Button variant="outline" className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white">
                  <Eye className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </Link>
            </div>

            <Card className="border-0 bg-white shadow-lg">
              <CardContent className="p-0">
                <div className="divide-y divide-[#f8d7da]">
                  {pendingVendors.map((vendor) => (
                    <div key={vendor.id} className="p-4 hover:bg-[#fdf6f0] transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-[#4e342e] rounded-full flex items-center justify-center">
                              <Building className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#4e342e]">{vendor.shopname}</p>
                              <p className="text-xs text-[#6d4c41]">
                                {vendor.user?.first_name} {vendor.user?.last_name} • {vendor.user?.email}
                              </p>
                              <p className="text-xs text-[#6d4c41]">
                                {new Date(vendor.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleVendorAction(vendor.id, 'APPROVED')}
                            disabled={processingVendor === vendor.id}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {processingVendor === vendor.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVendorAction(vendor.id, 'REJECTED')}
                            disabled={processingVendor === vendor.id}
                            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                          >
                            {processingVendor === vendor.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Reject
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Activity */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-serif font-bold text-[#4e342e]">Recent Activity</h2>
            <Link to="/admin/activities">
              <Button variant="outline" className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white">
                <Eye className="w-4 h-4 mr-2" />
                View All Activity
              </Button>
            </Link>
          </div>

          <Card className="border-0 bg-white shadow-lg">
            <CardContent className="p-0">
              <div className="divide-y divide-[#f8d7da]">
                {recentActivity.length === 0 ? (
                  <div className="p-8 text-center text-[#6d4c41]">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity found</p>
                  </div>
                ) : (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="p-4 hover:bg-[#fdf6f0] transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activity.status === 'success' ? 'bg-green-500' :
                          activity.status === 'pending' ? 'bg-yellow-500' :
                          activity.status === 'failed' ? 'bg-red-500' :
                          activity.status === 'cancelled' ? 'bg-gray-500' :
                          'bg-[#4e342e]'
                        }`}>
                          {getStatusIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[#4e342e] mb-1">{activity.description}</p>
                              <p className="text-xs text-[#6d4c41] mb-2">
                                {new Date(activity.timestamp).toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              
                              {/* User Info */}
                              {activity.user && (
                                <div className="space-y-1 mb-2">
                                  <p className="text-xs text-[#4e342e] font-medium">{activity.user.name}</p>
                                  {activity.user.email && (
                                    <p className="text-xs text-[#6d4c41] flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      {activity.user.email}
                                    </p>
                                  )}
                                  {activity.user.phone && (
                                    <p className="text-xs text-[#6d4c41] flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      {activity.user.phone}
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              {/* Vendor Info */}
                              {activity.vendor && (
                                <div className="space-y-1 mb-2">
                                  <p className="text-xs text-[#4e342e] font-medium">{activity.vendor.businessName}</p>
                                  <p className="text-xs text-[#6d4c41]">{activity.vendor.name}</p>
                                  {activity.vendor.email && (
                                    <p className="text-xs text-[#6d4c41] flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      {activity.vendor.email}
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              {/* Amount */}
                              {activity.amount !== undefined && activity.amount > 0 && (
                                <p className="text-sm text-[#4e342e] font-semibold mb-1">
                                  ${activity.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                              )}
                              
                              {/* Booking Type */}
                              {activity.bookingType && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {activity.bookingType === 'AT_HOME' ? 'At-Home Service' : 'Salon Visit'}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              {activity.status && (
                                <Badge className={getStatusBadgeColor(activity.status)}>
                                  {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                                </Badge>
                              )}
                              <Badge className="bg-[#4e342e] text-white text-xs">
                                {activity.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        

    
    
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
