import React, { useState, useEffect } from 'react';
import { adminApi } from '@/lib/adminApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Calendar,
    Search,
    Filter,
    RefreshCw,
    Scissors,
    CheckCircle,
    XCircle,
    Clock,
    ExternalLink
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface SalonOrder {
    id: string;
    vendorName: string;
    customerName: string;
    customerEmail: string;
    appointmentDate: string;
    appointmentTime: string;
    services: any[];
    totalAmount: number;
    paymentStatus: string;
    bookingStatus: string;
    createdAt: string;
}

const AdminAtSalonServicesPage = () => {
    const [orders, setOrders] = useState<SalonOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await adminApi.getAtSalonServices();
            if (response.success && response.data) {
                setOrders(response.data.orders || []);
            } else {
                toast.error(response.message || 'Failed to fetch orders');
            }
        } catch (error) {
            console.error('Error fetching salon orders:', error);
            toast.error('An error occurred while fetching orders');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'CONFIRMED':
                return <Badge className="bg-green-100 text-green-800 border-green-200">Confirmed</Badge>;
            case 'CANCELLED':
                return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
            case 'PENDING':
                return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
            case 'COMPLETED':
                return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Completed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPaymentBadge = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'PAID':
                return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Paid</Badge>;
            case 'PENDING':
                return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Pending</Badge>;
            case 'FAILED':
                return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
            case 'REFUNDED':
                return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Refunded</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || order.bookingStatus === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-[#4e342e] flex items-center gap-3">
                            <Scissors className="w-8 h-8 text-[#6d4c41]" />
                            At-Salon Services
                        </h1>
                        <p className="text-[#6d4c41] mt-1">View all vendor at-salon bookings and appointment history</p>
                    </div>
                    <Button
                        onClick={fetchOrders}
                        variant="outline"
                        className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white"
                        disabled={loading}
                    >
                        {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        Refresh Data
                    </Button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6d4c41] w-4 h-4" />
                        <Input
                            placeholder="Search by salon or customer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 border-[#f8d7da] focus:border-[#4e342e]"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full h-10 px-3 py-2 bg-white border border-[#f8d7da] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4e342e] focus:border-transparent text-[#4e342e]"
                    >
                        <option value="all">All Booking Status</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="PENDING">Pending</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                    <div className="flex items-center justify-end">
                        <Badge variant="outline" className="text-[#6d4c41] border-[#f8d7da]">
                            {filteredOrders.length} Bookings found
                        </Badge>
                    </div>
                </div>

                {/* Orders Table */}
                <Card className="border-0 shadow-lg overflow-hidden bg-white">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-[#fdf6f0]">
                                    <TableRow className="border-[#f8d7da]">
                                        <TableHead className="font-bold text-[#4e342e]">Salon / Vendor</TableHead>
                                        <TableHead className="font-bold text-[#4e342e]">Customer Details</TableHead>
                                        <TableHead className="font-bold text-[#4e342e]">Appt. Date & Time</TableHead>
                                        <TableHead className="font-bold text-[#4e342e]">Services</TableHead>
                                        <TableHead className="font-bold text-[#4e342e]">Total Amount</TableHead>
                                        <TableHead className="font-bold text-[#4e342e]">Payment</TableHead>
                                        <TableHead className="font-bold text-[#4e342e]">Status</TableHead>
                                        <TableHead className="font-bold text-[#4e342e]">Created At</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <TableRow key={i} className="animate-pulse border-[#f8d7da]">
                                                <TableCell colSpan={8} className="py-8"><div className="h-4 bg-gray-100 rounded w-full"></div></TableCell>
                                            </TableRow>
                                        ))
                                    ) : filteredOrders.length > 0 ? (
                                        filteredOrders.map((order) => (
                                            <TableRow key={order.id} className="hover:bg-[#f8d7da]/5 border-[#f8d7da]">
                                                <TableCell className="font-medium text-[#4e342e]">
                                                    {order.vendorName}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-[#4e342e]">{order.customerName}</span>
                                                        <span className="text-xs text-[#6d4c41]">{order.customerEmail}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-sm text-[#4e342e]">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5 text-[#6d4c41]" />
                                                            {order.appointmentDate}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <Clock className="w-3.5 h-3.5 text-[#6d4c41]" />
                                                            {order.appointmentTime}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-[200px]">
                                                    <div className="flex flex-wrap gap-1">
                                                        {order.services.map((s: any, idx) => (
                                                            <Badge key={idx} variant="secondary" className="bg-[#f8d7da]/20 text-[#4e342e] text-[10px]">
                                                                {s.name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-bold text-[#4e342e]">
                                                    {order.totalAmount} CDF
                                                </TableCell>
                                                <TableCell>
                                                    {getPaymentBadge(order.paymentStatus)}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(order.bookingStatus)}
                                                </TableCell>
                                                <TableCell className="text-xs text-[#6d4c41]">
                                                    {formatDateTime(order.createdAt)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-20 text-center">
                                                <div className="flex flex-col items-center justify-center text-[#6d4c41]">
                                                    <Calendar className="w-12 h-12 mb-4 opacity-20" />
                                                    <p className="text-lg font-medium">No at-salon bookings found</p>
                                                    <p className="text-sm">When vendors take bookings, they will appear here.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default AdminAtSalonServicesPage;
