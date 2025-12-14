import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/DashboardLayout';
import {
    Building,
    MapPin,
    Phone,
    Mail,
    Calendar,
    DollarSign,
    Users,
    Loader2,
    ArrowLeft,
    Scissors,
    Palette,
    Sparkles,
    Award,
    Clock,
    Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { managerApi } from '@/lib/managerApi';
import { motion } from 'framer-motion';

interface VendorDetails {
    id: string;
    shopName: string;
    description: string | null;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    status: string;
    createdAt: string;
    user: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
    };
    stats: {
        totalBookings: number;
        completedBookings: number;
        totalRevenue: number;
        totalServices: number;
        totalProducts: number;
        totalEmployees: number;
    };
}

interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    category: string;
    isActive: boolean;
    imageUrl?: string;
    createdAt: string;
}

const VendorDetailsPage = () => {
    const { vendorId } = useParams<{ vendorId: string }>();
    const navigate = useNavigate();
    const [vendor, setVendor] = useState<VendorDetails | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (vendorId) {
            fetchData(vendorId);
        }
    }, [vendorId]);

    const fetchData = async (id: string) => {
        try {
            setLoading(true);
            const [vendorRes, servicesRes] = await Promise.all([
                managerApi.getVendorDetails(id),
                managerApi.getVendorServices(id)
            ]);

            if (vendorRes.success && vendorRes.data) { // Check if data exists on the response object directly or inside data property depending on API structure. 
                // Based on manager.ts: res.json({ success: true, vendors: ... }) or single object?
                // getVendorDetails returns apiRequest result. 
                // endpoint: router.get('/vendors/:id/details'...) returns res.json({...vendorDetails}) directly? No, checks manager.ts
                // manager.ts sends JSON with fields directly? No, usually { success: true, data: ... } or just fields.
                // Correct check: manager.ts line 751: const vendorDetails = { ... }; res.json(vendorDetails); 
                // Wait, line 751 defines object, but response structure?
                // Let's re-read manager.ts line 673...
                // res.json(vendorDetails)  <-- directly returns the object.
                // BUT apiRequest wraps response? 
                // managerApi.ts: buildSuccessResponse wraps in { success: true, data: parsed.data }.
                // So if manager.ts returns { id: '...', ... }, then client gets { success: true, data: { id: '...', ... } }.
                // So vendorRes.data will be the vendor object.
                setVendor(vendorRes.data);
            } else {
                throw new Error(vendorRes.message || 'Failed to fetch vendor details');
            }

            if (servicesRes.success) {
                setServices(servicesRes.data?.services || []);
                // manager.ts line ~1350: res.json({ success: true, services: [...] })
                // So client gets { success: true, data: { success: true, services: [...] } } ??
                // Let's check apiRequest again.
                // If server returns { success: true, services: [...] }, parsed.data is that object.
                // success.data = parsed.data.
                // So servicesRes.data = { success: true, services: [...] }.
                // So servicesRes.data.services is the array.
            }

        } catch (error: any) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load vendor details');
            navigate('/manager/vendors');
        } finally {
            setLoading(false);
        }
    };

    const getCategoryIcon = (category: string) => {
        const normalized = (category || '').toLowerCase();
        if (normalized.includes('hair')) return Scissors;
        if (normalized.includes('face') || normalized.includes('makeup')) return Palette;
        if (normalized.includes('nail')) return Sparkles;
        if (normalized.includes('spa')) return Award;
        return Sparkles;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="w-8 h-8 animate-spin text-[#4e342e]" />
                </div>
            </DashboardLayout>
        )
    }

    if (!vendor) return null;

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                <Button
                    variant="ghost"
                    className="mb-6 pl-0 hover:bg-transparent hover:text-[#4e342e]"
                    onClick={() => navigate('/manager/vendors')}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Vendors
                </Button>

                {/* Vendor Header */}
                <div className="bg-white rounded-xl shadow-lg border border-[#f8d7da]/20 p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-24 h-24 bg-[#4e342e] rounded-xl flex items-center justify-center flex-shrink-0">
                            <Building className="w-12 h-12 text-white" />
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div>
                                    <h1 className="text-3xl font-serif font-bold text-[#4e342e] mb-2">{vendor.shopName}</h1>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="border-[#4e342e] text-[#4e342e]">
                                            {vendor.status}
                                        </Badge>
                                        <span className="text-[#6d4c41] text-sm flex items-center">
                                            <MapPin className="w-4 h-4 mr-1" />
                                            {vendor.city}, {vendor.state}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="text-center p-3 bg-[#fdf6f0] rounded-lg">
                                        <div className="text-2xl font-bold text-[#4e342e]">{vendor.stats.totalServices}</div>
                                        <div className="text-xs text-[#6d4c41]">Services</div>
                                    </div>
                                    <div className="text-center p-3 bg-[#fdf6f0] rounded-lg">
                                        <div className="text-2xl font-bold text-[#4e342e]">{vendor.stats.totalBookings}</div>
                                        <div className="text-xs text-[#6d4c41]">Bookings</div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#f8d7da] pt-4">
                                <div className="flex items-center gap-2 text-[#6d4c41]">
                                    <Users className="w-4 h-4" />
                                    <span className="text-sm">{vendor.user.firstName} {vendor.user.lastName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[#6d4c41]">
                                    <Mail className="w-4 h-4" />
                                    <span className="text-sm">{vendor.user.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[#6d4c41]">
                                    <Phone className="w-4 h-4" />
                                    <span className="text-sm">{vendor.user.phone || 'No phone'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Content Tabs */}
                <Tabs defaultValue="services" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8 bg-[#fdf6f0]">
                        <TabsTrigger
                            value="services"
                            className="data-[state=active]:bg-[#4e342e] data-[state=active]:text-white"
                        >
                            Services
                        </TabsTrigger>
                        <TabsTrigger
                            value="employees"
                            className="data-[state=active]:bg-[#4e342e] data-[state=active]:text-white"
                        >
                            Employees
                        </TabsTrigger>
                        <TabsTrigger
                            value="products"
                            className="data-[state=active]:bg-[#4e342e] data-[state=active]:text-white"
                        >
                            Products
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="services">
                        <div className="mb-8">
                            <h2 className="text-2xl font-serif font-bold text-[#4e342e] mb-6">Services Catalog</h2>
                            {services.length === 0 ? (
                                <Card className="border-0 bg-white shadow-lg">
                                    <CardContent className="p-12 text-center">
                                        <Sparkles className="w-16 h-16 text-[#6d4c41]/50 mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold text-[#4e342e] mb-2">No services found</h3>
                                        <p className="text-[#6d4c41]">This vendor has not added any services yet.</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {services.map((service, index) => {
                                        const CategoryIcon = getCategoryIcon(service.category);
                                        return (
                                            <motion.div
                                                key={service.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                            >
                                                <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col overflow-hidden">
                                                    {/* Image Thumbnail */}
                                                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                                                        {service.imageUrl ? (
                                                            <img
                                                                src={service.imageUrl}
                                                                alt={service.name}
                                                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-[#fdf6f0]">
                                                                <ImageIcon className="w-12 h-12 text-[#d7ccc8]" />
                                                            </div>
                                                        )}
                                                        <div className="absolute top-2 right-2">
                                                            <Badge className={service.isActive ? 'bg-green-500' : 'bg-gray-500'}>
                                                                {service.isActive ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <CardHeader className="pb-2">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="p-1.5 bg-[#fdf6f0] rounded-md">
                                                                <CategoryIcon className="w-3 h-3 text-[#4e342e]" />
                                                            </div>
                                                            <span className="text-xs font-medium text-[#6d4c41] uppercase tracking-wide">
                                                                {service.category}
                                                            </span>
                                                        </div>
                                                        <CardTitle className="text-bg text-[#4e342e] line-clamp-1">{service.name}</CardTitle>
                                                    </CardHeader>

                                                    <CardContent className="flex-1 flex flex-col justify-between">
                                                        <p className="text-[#6d4c41] text-sm mb-4 line-clamp-2">{service.description}</p>

                                                        <div className="flex items-center justify-between pt-4 border-t border-[#f8d7da]/30">
                                                            <div className="flex items-center text-[#4e342e] font-bold">
                                                                <DollarSign className="w-4 h-4" />
                                                                <span className="text-lg">{service.price}</span>
                                                            </div>
                                                            <div className="flex items-center text-[#6d4c41] text-sm">
                                                                <Clock className="w-4 h-4 mr-1" />
                                                                <span>{service.duration} min</span>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="employees">
                        <Card className="border-0 bg-white shadow-lg">
                            <CardContent className="p-12 text-center">
                                <Users className="w-16 h-16 text-[#6d4c41]/50 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-[#4e342e] mb-2">Employees Management</h3>
                                <p className="text-[#6d4c41] mb-6">This feature is coming soon. Managers will be able to view vendor employees here.</p>
                                <Button variant="outline" className="border-[#4e342e] text-[#4e342e]" disabled>
                                    Coming Soon
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="products">
                        <Card className="border-0 bg-white shadow-lg">
                            <CardContent className="p-12 text-center">
                                <div className="w-16 h-16 bg-[#fdf6f0] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="w-8 h-8 text-[#4e342e]" />
                                </div>
                                <h3 className="text-xl font-semibold text-[#4e342e] mb-2">Products Management</h3>
                                <p className="text-[#6d4c41] mb-6">This feature is coming soon. Managers will be able to view vendor products here.</p>
                                <Button variant="outline" className="border-[#4e342e] text-[#4e342e]" disabled>
                                    Coming Soon
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default VendorDetailsPage;
