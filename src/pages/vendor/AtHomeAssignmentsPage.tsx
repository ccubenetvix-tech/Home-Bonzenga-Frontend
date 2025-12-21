import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Calendar,
    Clock,
    MapPin,
    User,
    Package,
    Scissors,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AssignedBooking {
    id: string; // Booking ID
    customer: {
        first_name: string;
        last_name: string;
        phone: string;
    };
    address: string;
    slot: string;
    total_amount: number;
    myServices: any[];
    myProducts: any[];
    vendorStatus: 'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'REJECTED';
}

const AtHomeAssignmentsPage = () => {
    const [assignments, setAssignments] = useState<AssignedBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const response = await api.get('/vendor/athome-assignments');
            const data = response.data as any;
            if (data.success) {
                setAssignments(data.data);
            } else {
                toast.error('Failed to load assignments');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error loading assignments');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (bookingId: string, action: 'accept' | 'reject') => {
        try {
            setProcessingId(bookingId);
            const endpoint = action === 'accept' ? 'accept' : 'reject';
            const response = await api.post(`/vendor/athome-assignments/${bookingId}/${endpoint}`);
            const data = response.data as any;

            if (data.success) {
                toast.success(`Booking ${action}ed successfully`);
                fetchAssignments(); // Refresh
            } else {
                toast.error(`Failed to ${action} booking`);
            }
        } catch (error) {
            console.error(error);
            toast.error(`Error ${action}ing booking`);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="container mx-auto py-8">
                <h1 className="text-3xl font-serif font-bold text-[#4e342e] mb-2">My Assignments</h1>
                <p className="text-[#6d4c41] mb-8">View and manage your assigned at-home service requests.</p>

                {loading ? (
                    <div className="text-center py-12">Loading assignments...</div>
                ) : assignments.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-dashed">
                        <div className="text-xl font-medium text-[#4e342e] mb-2">No Active Assignments</div>
                        <p className="text-[#6d4c41]">You haven't been assigned any at-home bookings yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {assignments.map((assignment) => (
                            <Card key={assignment.id} className="border hover:shadow-lg transition-shadow">
                                <CardHeader className="bg-muted/20 pb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <Badge className="mb-2 bg-[#4e342e] hover:bg-[#3b2c26]">At-Home Service</Badge>
                                            <CardTitle className="text-lg text-[#4e342e]">
                                                {assignment.customer?.first_name} {assignment.customer?.last_name}
                                            </CardTitle>
                                        </div>
                                        <Badge variant={assignment.vendorStatus === 'ACCEPTED' ? 'default' : 'secondary'} className={assignment.vendorStatus === 'ACCEPTED' ? 'bg-green-600' : ''}>
                                            {assignment.vendorStatus?.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-[#6d4c41]">
                                            <Calendar className="w-4 h-4" />
                                            <span>{assignment.slot ? format(new Date(assignment.slot), 'PPP') : 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[#6d4c41]">
                                            <Clock className="w-4 h-4" />
                                            <span>{assignment.slot ? format(new Date(assignment.slot), 'h:mm a') : 'N/A'}</span>
                                        </div>
                                        <div className="flex items-start gap-2 text-[#6d4c41]">
                                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <span className="line-clamp-2">{assignment.address}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[#6d4c41]">
                                            <User className="w-4 h-4" />
                                            <span>{assignment.customer?.phone}</span>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div>
                                        <h4 className="font-semibold text-sm mb-2 text-[#4e342e]">Assigned Items</h4>
                                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                            {assignment.myServices.map((s, idx) => (
                                                <div key={`svc-${idx}`} className="flex justify-between text-sm bg-blue-50 p-2 rounded border border-blue-100">
                                                    <div className="flex items-center gap-2">
                                                        <Scissors className="w-3 h-3 text-blue-700" />
                                                        <span className="text-blue-900 font-medium truncate max-w-[150px]">{s.master_service?.name}</span>
                                                    </div>
                                                    <span className="text-xs font-semibold text-blue-700">{s.status}</span>
                                                </div>
                                            ))}
                                            {assignment.myProducts.map((p, idx) => (
                                                <div key={`prod-${idx}`} className="flex justify-between text-sm bg-orange-50 p-2 rounded border border-orange-100">
                                                    <div className="flex items-center gap-2">
                                                        <Package className="w-3 h-3 text-orange-700" />
                                                        <span className="text-orange-900 font-medium truncate max-w-[150px]">{p.master_product?.name} (x{p.quantity})</span>
                                                    </div>
                                                    <span className="text-xs font-semibold text-orange-700">{p.status}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>

                                {assignment.vendorStatus === 'PENDING_ACCEPTANCE' && (
                                    <CardFooter className="pt-2 gap-3 border-t bg-muted/20">
                                        <Button
                                            className="flex-1 bg-green-700 hover:bg-green-800 text-white"
                                            onClick={() => handleAction(assignment.id, 'accept')}
                                            disabled={!!processingId}
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" /> Accept
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            className="flex-1"
                                            onClick={() => handleAction(assignment.id, 'reject')}
                                            disabled={!!processingId}
                                        >
                                            <XCircle className="w-4 h-4 mr-2" /> Reject
                                        </Button>
                                    </CardFooter>
                                )}
                                {assignment.vendorStatus === 'ACCEPTED' && (
                                    <CardFooter className="pt-4 border-t bg-green-50/50 justify-center text-green-700 text-sm font-medium">
                                        <CheckCircle className="w-4 h-4 mr-2" /> You have accepted this booking
                                    </CardFooter>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AtHomeAssignmentsPage;
