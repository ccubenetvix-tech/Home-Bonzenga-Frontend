import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, MapPin, User, Package, Scissors, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AtHomeBooking {
    id: string;
    created_at: string;
    customer: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
    };
    address: string | any; // Supports legacy string or JSON object
    slot: string; // ISO date
    preferences: any;
    total_amount: number;
    payment_status: string;
    status: string; // 'PENDING' | 'ASSIGNED' | 'COMPLETED'
    services: any[];
    products: any[];
}

interface EligibleVendor {
    id: string; // vendor_id
    shopname: string;
    distance: number; // if available, or just mocking
    services: any[];
    user: {
        first_name: string;
        last_name: string;
    }
}

const AtHomeBookingsPage = () => {
    const [bookings, setBookings] = useState<AtHomeBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<AtHomeBooking | null>(null);
    const [eligibleVendors, setEligibleVendors] = useState<EligibleVendor[]>([]);
    const [loadingVendors, setLoadingVendors] = useState(false);

    // Selection state
    const [selectedServiceVendor, setSelectedServiceVendor] = useState<string>('');
    const [selectedProductVendor, setSelectedProductVendor] = useState<string>('');
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/manager/athome-bookings');
            if (response.data.success) {
                setBookings(response.data.data);
            } else {
                toast.error('Failed to fetch bookings');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error loading bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleManageBooking = async (booking: AtHomeBooking) => {
        setSelectedBooking(booking);
        setLoadingVendors(true);
        setSelectedServiceVendor('');
        setSelectedProductVendor('');

        try {
            const response = await api.get(`/manager/athome-bookings/${booking.id}/eligible-vendors`);
            if (response.data.success) {
                setEligibleVendors(response.data.data);
            } else {
                toast.error('Failed to load eligible vendors');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error fetching vendors');
        } finally {
            setLoadingVendors(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedBooking) return;
        if (!selectedServiceVendor && selectedBooking.services.length > 0) {
            toast.error('Please select a service vendor');
            return;
        }
        // Product vendor is optional if no products? Or if products exist.
        if (!selectedProductVendor && selectedBooking.products.length > 0) {
            toast.error('Please select a product vendor');
            return;
        }

        try {
            setIsAssigning(true);
            // Updated endpoint to match backend (already matches /manager/athome-bookings via router)
            const response = await api.post(`/manager/athome-bookings/${selectedBooking.id}/assign`, {
                service_vendor_id: selectedServiceVendor,
                product_vendor_id: selectedProductVendor
            });

            if (response.data.success) {
                toast.success('Vendors assigned successfully!');
                setSelectedBooking(null);
                fetchBookings(); // Refresh list
            } else {
                toast.error('Failed to assign vendors');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error assigning vendors');
        } finally {
            setIsAssigning(false);
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'ASSIGNED': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'ACCEPTED': return 'bg-green-100 text-green-800 border-green-200'; // Added ACCEPTED
            case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
            case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // PENDING
        }
    };

    // Helper to format address
    const formatAddress = (addr: any) => {
        if (!addr) return 'N/A';
        if (typeof addr === 'string') return addr;
        const parts = [addr.street, addr.city, addr.state].filter(Boolean);
        return parts.join(', ');
    };

    return (
        <DashboardLayout>
            <div className="container mx-auto py-8">
                <h1 className="text-3xl font-serif font-bold text-[#4e342e] mb-2">Assign Vendors</h1>
                <p className="text-[#6d4c41] mb-8">Manage incoming at-home service requests and assign them to eligible vendors.</p>

                {loading ? (
                    <div className="text-center py-12">Loading bookings...</div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Service Slot</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Requests</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bookings.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No pending bookings found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    bookings.map((booking) => (
                                        <TableRow key={booking.id}>
                                            <TableCell>
                                                <div className="font-medium text-[#4e342e]">{booking.customer?.first_name} {booking.customer?.last_name}</div>
                                                <div className="text-xs text-muted-foreground">{booking.customer?.phone}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm text-[#4e342e]">
                                                    <Calendar className="w-4 h-4" />
                                                    {booking.slot ? format(new Date(booking.slot), 'MMM d, yyyy') : 'N/A'}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                    <Clock className="w-4 h-4" />
                                                    {booking.slot ? format(new Date(booking.slot), 'h:mm a') : 'N/A'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm max-w-[200px] truncate" title={formatAddress(booking.address)}>
                                                    <MapPin className="w-4 h-4 flex-shrink-0" />
                                                    {formatAddress(booking.address)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {booking.services.length > 0 && (
                                                        <Badge variant="outline" className="mr-1 border-blue-200 bg-blue-50 text-blue-700">
                                                            {booking.services.length} Services
                                                        </Badge>
                                                    )}
                                                    {booking.products.length > 0 && (
                                                        <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                                                            {booking.products.length} Products
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getStatusBadgeColor(booking.status)}>
                                                    {booking.status || 'PENDING'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {booking.status === 'ASSIGNED' ? (
                                                    <Button variant="outline" size="sm" disabled className="text-green-600 border-green-200 bg-green-50">
                                                        <CheckCircle className="w-4 h-4 mr-1" /> Assigned
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={() => handleManageBooking(booking)}
                                                        className="bg-[#4e342e] hover:bg-[#3b2c26] text-white"
                                                        size="sm"
                                                    >
                                                        Assign Vendor
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Assignment Modal */}
                <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Assign Vendor to Booking</DialogTitle>
                        </DialogHeader>

                        {selectedBooking && (
                            <div className="space-y-6">
                                {/* Booking Details Summary */}
                                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                                    <div>
                                        <h4 className="font-semibold text-sm text-[#4e342e] flex items-center gap-2">
                                            <User className="w-4 h-4" /> Customer
                                        </h4>
                                        <p className="text-sm mt-1">{selectedBooking.customer?.first_name} {selectedBooking.customer?.last_name}</p>
                                        <p className="text-xs text-muted-foreground">{selectedBooking.customer?.phone}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm text-[#4e342e] flex items-center gap-2">
                                            <MapPin className="w-4 h-4" /> Location
                                        </h4>
                                        <p className="text-sm mt-1">{selectedBooking.address}</p>
                                    </div>
                                </div>

                                {/* Services Assignment */}
                                {selectedBooking.services.length > 0 && (
                                    <div className="border rounded-lg p-4">
                                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                            <Scissors className="w-5 h-5" /> Service Assignment
                                        </h3>
                                        <div className="mb-4 space-y-2">
                                            {selectedBooking.services.map((s, idx) => (
                                                <div key={idx} className="text-sm flex justify-between bg-secondary/20 p-2 rounded">
                                                    <span>{s.master_service?.name || 'Service'}</span>
                                                    <span className="font-medium">{s.service_price} CDF</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Select Service Vendor</label>
                                            <Select value={selectedServiceVendor} onValueChange={setSelectedServiceVendor}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choose a qualified vendor..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {loadingVendors ? (
                                                        <SelectItem value="loading" disabled>Loading eligible vendors...</SelectItem>
                                                    ) : eligibleVendors.length === 0 ? (
                                                        <SelectItem value="none" disabled>No eligible vendors found</SelectItem>
                                                    ) : (
                                                        eligibleVendors.map((vendor) => (
                                                            <SelectItem key={vendor.id} value={vendor.id}>
                                                                {vendor.shopname} ({vendor.user?.first_name})
                                                                {/* Add distance if available */}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}

                                {/* Products Assignment */}
                                {selectedBooking.products.length > 0 && (
                                    <div className="border rounded-lg p-4">
                                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                            <Package className="w-5 h-5" /> Product Fulfillment
                                        </h3>
                                        <div className="mb-4 space-y-2">
                                            {selectedBooking.products.map((p, idx) => (
                                                <div key={idx} className="text-sm flex justify-between bg-secondary/20 p-2 rounded">
                                                    <span>{p.master_product?.name || 'Product'} (x{p.quantity})</span>
                                                    <span className="font-medium">{p.product_price} CDF</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Select Product Vendor</label>
                                            {/* Usually same vendors sell products, or specific product vendors. logic filters them. */}
                                            <Select value={selectedProductVendor} onValueChange={setSelectedProductVendor}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choose a product vendor..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {loadingVendors ? (
                                                        <SelectItem value="loading" disabled>Loading eligible vendors...</SelectItem>
                                                    ) : eligibleVendors.length === 0 ? (
                                                        <SelectItem value="none" disabled>No eligible vendors found</SelectItem>
                                                    ) : (
                                                        eligibleVendors.map((vendor) => (
                                                            <SelectItem key={`prod-${vendor.id}`} value={vendor.id}>
                                                                {vendor.shopname}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                * Often the same vendor can provide services and products if they have stock.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end pt-4 gap-2">
                                    <Button variant="outline" onClick={() => setSelectedBooking(null)}>Cancel</Button>
                                    <Button
                                        className="bg-[#4e342e] hover:bg-[#3b2c26] text-white"
                                        onClick={handleAssign}
                                        disabled={isAssigning || loadingVendors}
                                    >
                                        {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default AtHomeBookingsPage;
