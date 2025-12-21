
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import DashboardLayout from '@/components/DashboardLayout';
import {
    Calendar,
    Search,
    Eye,
    User,
    MapPin,
    Package,
    Clock,
    Activity,
    CheckCircle,
    AlertCircle,
    UserCheck,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface LiveUpdate {
    status: string;
    message: string;
    created_at: string;
}

interface Booking {
    id: string;
    customer: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
    };
    beautician?: {
        name: string;
        phone: string;
    };
    services: {
        master: { name: string; duration_minutes: number };
    }[];
    products: {
        master: { name: string };
        quantity: number;
    }[];
    status: string;
    address: any;
    slot: string;
    total_price: number;
    payment_status?: string;
    live_updates: LiveUpdate[];
    created_at: string;
}

const AdminAtHomeBookingsPage = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredBookings(bookings);
        } else {
            const lower = searchTerm.toLowerCase();
            setFilteredBookings(bookings.filter(b =>
                b.customer.first_name.toLowerCase().includes(lower) ||
                b.customer.last_name.toLowerCase().includes(lower) ||
                b.id.toLowerCase().includes(lower) ||
                (b.beautician?.name || '').toLowerCase().includes(lower)
            ));
        }
    }, [searchTerm, bookings]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/athome-bookings');
            const data = response.data as any;
            if (data?.success) {
                setBookings(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast.error('Failed to load at-home bookings');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            case 'ASSIGNED': return 'bg-blue-100 text-blue-800';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatAddress = (addr: any) => {
        if (!addr) return 'N/A';
        if (typeof addr === 'string') return addr;
        return `${addr.street || ''}, ${addr.city || ''}`;
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-[#4e342e]">At-Home Bookings (Admin)</h1>
                        <p className="text-[#6d4c41]">Monitor all at-home service requests and assignments.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search by customer, beautician, or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button variant="outline" onClick={fetchBookings}>
                        Refresh
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-[#4e342e]" />
                    </div>
                ) : (
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="pb-0">
                            <CardTitle>All At-Home Bookings ({bookings.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Booking ID</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Service Info</TableHead>
                                        <TableHead>Assigned Beautician</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Live Update</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredBookings.map((booking) => {
                                        const latestUpdate = booking.live_updates?.[0]; // Assuming sorted desc from backend
                                        return (
                                            <TableRow key={booking.id}>
                                                <TableCell className="font-mono text-xs">
                                                    {booking.id.slice(0, 8)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{booking.customer.first_name} {booking.customer.last_name}</span>
                                                        <span className="text-xs text-gray-500">{booking.customer.phone}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {booking.services.map((s, i) => (
                                                            <div key={i}>• {s.master?.name}</div>
                                                        ))}
                                                        {booking.products.length > 0 && (
                                                            <div className="text-xs text-blue-600 mt-1">
                                                                + {booking.products.length} Products
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {booking.beautician ? (
                                                        <div className="flex items-center gap-2">
                                                            <UserCheck className="w-4 h-4 text-green-600" />
                                                            <span className="font-medium">{booking.beautician.name}</span>
                                                        </div>
                                                    ) : (
                                                        <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                                                            Pending Assign
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusColor(booking.status)}>
                                                        {booking.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {latestUpdate ? (
                                                        <div className="text-xs max-w-[150px]">
                                                            <div className="font-medium">{latestUpdate.status}</div>
                                                            <div className="text-gray-500 truncate" title={latestUpdate.message}>
                                                                {latestUpdate.message}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Button size="sm" variant="ghost" onClick={() => setSelectedBooking(booking)}>
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {filteredBookings.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                                No bookings found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Details Modal */}
            <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Booking Details</DialogTitle>
                        <DialogDescription>Full details for booking #{selectedBooking?.id.slice(0, 8)}</DialogDescription>
                    </DialogHeader>

                    {selectedBooking && (
                        <div className="grid grid-cols-2 gap-6 py-4">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-sm text-gray-500 mb-1">Customer</h4>
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span>{selectedBooking.customer.first_name} {selectedBooking.customer.last_name}</span>
                                    </div>
                                    <div className="text-sm text-gray-600 ml-6">{selectedBooking.customer.email}</div>
                                    <div className="text-sm text-gray-600 ml-6">{selectedBooking.customer.phone}</div>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-sm text-gray-500 mb-1">Location & Time</h4>
                                    <div className="flex items-center gap-2 mb-1">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm">{formatAddress(selectedBooking.address)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm">
                                            {new Date(selectedBooking.slot).toLocaleDateString()} at {new Date(selectedBooking.slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-sm text-gray-500 mb-1">Assigned Beautician</h4>
                                    {selectedBooking.beautician ? (
                                        <div className="bg-green-50 p-3 rounded-md border border-green-100">
                                            <div className="font-medium text-green-800">{selectedBooking.beautician.name}</div>
                                            <div className="text-sm text-green-600">{selectedBooking.beautician.phone}</div>
                                        </div>
                                    ) : (
                                        <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100 text-yellow-800 text-sm">
                                            No beautician assigned yet.
                                            <br />
                                            <span className="text-xs italic">Manager must assign.</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h4 className="font-semibold text-sm text-gray-500 mb-1">Services & Products</h4>
                                    <ul className="text-sm space-y-1">
                                        {selectedBooking.services.map((s, i) => (
                                            <li key={`s-${i}`} className="flex justify-between">
                                                <span>{s.master?.name}</span>
                                                <span className="text-gray-500">{s.master?.duration_minutes} min</span>
                                            </li>
                                        ))}
                                    </ul>
                                    {selectedBooking.products.length > 0 && (
                                        <div className="mt-2 pt-2 border-t">
                                            <h5 className="text-xs font-semibold text-gray-500 mb-1">Products</h5>
                                            <ul className="text-sm space-y-1">
                                                {selectedBooking.products.map((p, i) => (
                                                    <li key={`p-${i}`} className="flex justify-between text-blue-700">
                                                        <span>{p.master?.name}</span>
                                                        <span>x{p.quantity}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-span-2">
                                <h4 className="font-semibold text-sm text-gray-500 mb-2">Live Timeline</h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto bg-gray-50 p-3 rounded-md">
                                    {selectedBooking.live_updates?.length > 0 ? (
                                        selectedBooking.live_updates.map((update, i) => (
                                            <div key={i} className="flex gap-2 text-sm">
                                                <span className="text-gray-400 font-mono text-xs whitespace-nowrap">
                                                    {new Date(update.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <div className="flex-1">
                                                    <span className="font-medium text-gray-700">{update.status}</span>
                                                    {update.message && <span className="text-gray-500 ml-2">- {update.message}</span>}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-gray-400 text-sm text-center">No updates yet</div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Section */}
                            <div className="col-span-2 border-t pt-4">
                                <h4 className="font-semibold text-sm text-gray-500 mb-2">Payment & Invoice</h4>
                                <div className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-md">
                                    <div className="flex gap-8 items-center">
                                        <div className="flex flex-col">
                                            <span className="text-gray-500 text-xs uppercase tracking-wider">Total Amount</span>
                                            <span className="font-bold text-xl text-[#4e342e]">{selectedBooking.total_price?.toLocaleString()} CDF</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Status</span>
                                            <Badge variant={selectedBooking.payment_status === 'PAID' || selectedBooking.payment_status === 'SUCCESS' ? 'default' : 'outline'} className={selectedBooking.payment_status === 'PAID' || selectedBooking.payment_status === 'SUCCESS' ? 'bg-green-600' : ''}>
                                                {selectedBooking.payment_status || 'PENDING'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => {
                                        const handleDownload = async () => {
                                            if (!selectedBooking) return;
                                            try {
                                                toast.loading('Generating invoice...');
                                                const genRes = await api.post(`/invoices/generate/${selectedBooking.id}`);
                                                const data = genRes.data as any;
                                                if (data.success) {
                                                    toast.dismiss();
                                                    toast.success('Invoice ready! Downloading...');
                                                    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/invoices/download/${selectedBooking.id}`, '_blank');
                                                } else {
                                                    toast.dismiss();
                                                    toast.error(data.message || 'Failed to generate invoice');
                                                }
                                            } catch (error) {
                                                console.error(error);
                                                toast.dismiss();
                                                toast.error('Error downloading invoice');
                                            }
                                        };
                                        handleDownload();
                                    }}>
                                        Download Invoice
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button onClick={() => setSelectedBooking(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default AdminAtHomeBookingsPage;
