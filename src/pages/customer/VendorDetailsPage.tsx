import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api'; // Added import
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import {
    MapPin,
    Star,
    Clock,
    Users,
    Phone,
    Mail,
    Calendar,
    Scissors,
    Palette,
    Sparkles,
    Award,
    ShoppingCart,
    Plus,
    Minus,
    ArrowLeft,
    Building,
    Heart,
    Share2,
    CheckCircle
} from 'lucide-react';

interface Vendor {
    id: string;
    name: string;
    description: string;
    address: string;
    city: string;
    rating: number;
    reviewCount: number;
    distance: number;
    categories: string[];
    images: string[];
    isOpen: boolean;
    nextAvailableSlot: string;
    phone: string;
    email: string;
    workingHours: {
        [key: string]: string;
    };
}

interface Beautician {
    id: string;
    name: string;
    specialization: string[];
    rating: number;
    experience: number;
    avatar: string;
    isAvailable: boolean;
    nextAvailableSlot: string;
}

interface Service {
    id: string;
    name: string;
    description: string;
    duration: number;
    price: number;
    category: string;
    beauticianId?: string;
    image?: string;
    isAvailable?: boolean;
}

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    inStock: boolean;
    category: string;
}

const VendorDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [beauticians, setBeauticians] = useState<Beautician[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedServices, setSelectedServices] = useState<Service[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<{ [key: string]: number }>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchVendorDetails();
        }
    }, [id]);

    const fetchVendorDetails = async () => {
        try {
            setLoading(true);
            console.log('Fetching vendor details for ID:', id);
            const response = await fetch('http://localhost:3001/api/vendors/' + id);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to fetch vendor details:', errorText);
                throw new Error('Failed to fetch vendor details');
            }

            const data = await response.json();
            console.log('Vendor data received:', data);

            // Transform vendor data - API returns vendor with nested data
            if (data.vendor) {
                const transformedVendor: Vendor = {
                    id: data.vendor.id,
                    name: data.vendor.name || data.vendor.shopName,
                    description: data.vendor.description || '',
                    address: data.vendor.address || '',
                    city: data.vendor.city,
                    rating: data.vendor.rating || 4.8,
                    reviewCount: data.vendor.reviewCount || 0,
                    distance: data.vendor.distance || 0,
                    categories: data.vendor.categories || [],
                    images: data.vendor.images || [],
                    isOpen: data.vendor.isOpen !== undefined ? data.vendor.isOpen : true,
                    nextAvailableSlot: data.vendor.nextAvailableSlot || 'Available today',
                    phone: data.vendor.phone || '',
                    email: data.vendor.email || '',
                    workingHours: data.vendor.workingHours || {}
                };

                setVendor(transformedVendor);

                // Transform services - API returns services as separate array
                console.log('Services data from API:', data.services);
                const transformedServices: Service[] = (data.services || []).map((service: any) => ({
                    id: service.id,
                    name: service.name,
                    description: service.description || '',
                    price: service.price,
                    duration: service.duration || 60,
                    category: service.category || 'General',
                    image: service.image || '/api/placeholder/300/200',
                    isAvailable: service.isActive !== undefined ? service.isActive : true
                }));

                console.log('Transformed services:', transformedServices);
                setServices(transformedServices);
            }

            // Fetch products
            try {
                const productsResponse = await api.get(`/catalog/products?vendorId=${id}`);
                const productsData = productsResponse.data as any; // Adjust type as needed
                console.log('Products data received:', productsData);

                if (productsData && Array.isArray(productsData.products)) {
                    const transformedProducts: Product[] = productsData.products.map((p: any) => ({
                        id: p.id,
                        name: p.product_name,
                        description: p.description || '',
                        price: p.price_cdf,
                        image: p.image_url || '/api/placeholder/150/150',
                        inStock: p.stock_quantity > 0,
                        category: p.category_id
                    }));
                    setProducts(transformedProducts);
                } else {
                    setProducts([]);
                }
            } catch (prodError) {
                console.error('Error fetching products:', prodError);
                // Fallback to empty or mock if needed, but for now empty
                setProducts([]);
            }

            // Set mock data for beauticians for now
            setBeauticians(data.beauticians || []);
            // Products are now fetched above
        } finally {
            setLoading(false);
        }
    };

    const addService = (service: Service) => {
        setSelectedServices(prev => [...prev, service]);
    };

    const removeService = (serviceId: string) => {
        setSelectedServices(prev => prev.filter(s => s.id !== serviceId));
    };

    const updateProductQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            const newProducts = { ...selectedProducts };
            delete newProducts[productId];
            setSelectedProducts(newProducts);
        } else {
            setSelectedProducts(prev => ({ ...prev, [productId]: quantity }));
        }
    };

    const getTotalPrice = () => {
        const servicesTotal = selectedServices.reduce((sum, service) => sum + service.price, 0);
        const productsTotal = Object.entries(selectedProducts).reduce((sum, [productId, quantity]) => {
            const product = products.find(p => p.id === productId);
            return sum + (product ? product.price * quantity : 0);
        }, 0);
        return servicesTotal + productsTotal;
    };

    const proceedToCheckout = () => {
        const statePayload = {
            vendor,
            services: selectedServices,
            products: Object.entries(selectedProducts).map(([id, qty]) => {
                const product = products.find(p => p.id === id);
                return product ? { ...product, quantity: qty } : null;
            }).filter(Boolean)
        } as any;
        // Use window.history state via Link equivalent
        // Navigate programmatically to avoid complex JSX state expression
        (window as any).appNavigate
            ? (window as any).appNavigate('/booking/checkout', { state: statePayload })
            : (location.href = '/booking/checkout');
    };

    const fadeInUp = {
        initial: { opacity: 0, y: 60 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navigation />
                <div className="pt-20 flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4e342e] mx-auto mb-4"></div>
                        <p className="text-[#6d4c41]">Loading vendor details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!vendor) {
        return (
            <div className="min-h-screen bg-background">
                <Navigation />
                <div className="pt-20 flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <Building className="w-16 h-16 text-[#6d4c41] opacity-50 mx-auto mb-4" />
                        <h2 className="text-2xl font-semibold text-[#4e342e] mb-2">Vendor not found</h2>
                        <p className="text-[#6d4c41] mb-6">The salon you're looking for doesn't exist.</p>
                        <Link to="/salon-visit">
                            <Button variant="outline" className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Salons
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navigation />

            {/* HERO SECTION */}
            <div className="relative pt-20">
                <div className="h-[340px] bg-gradient-to-br from-[#4e342e] via-[#6d4c41] to-[#4e342e]">
                    <div className="container mx-auto h-full px-4 flex items-end pb-6">
                        <div className="w-full flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <Link to="/salon-visit">
                                        <Button variant="outline" size="sm" className="border-white border-opacity-60 text-white hover:bg-white hover:text-[#4e342e]">
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Back
                                        </Button>
                                    </Link>
                                    <Badge variant="secondary" className="bg-white bg-opacity-90 text-[#4e342e]">Verified Vendor</Badge>
                                </div>
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white drop-shadow">
                                    {vendor.name}
                                </h1>
                                <div className="flex items-center gap-4 mt-3 text-white opacity-90">
                                    <span className="flex items-center gap-1">
                                        <Star className="w-4 h-4 text-yellow-300 fill-current" /> {vendor.rating} ({vendor.reviewCount})
                                    </span>
                                    <span className={"px-2.5 py-1 rounded text-sm " + (vendor.isOpen ? 'bg-emerald-500 bg-opacity-20' : 'bg-red-500 bg-opacity-20')}>{vendor.isOpen ? 'Open' : 'Closed'}</span>
                                </div>
                            </div>
                            <div className="hidden md:flex items-center gap-2">
                                <Button variant="outline" size="sm" className="border-white border-opacity-60 text-white hover:bg-white hover:text-[#4e342e]">
                                    <Heart className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm" className="border-white border-opacity-60 text-white hover:bg-white hover:text-[#4e342e]">
                                    <Share2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="container mx-auto px-4 -mt-10 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT: MAIN */}
                    <div className="lg:col-span-2">
                        {/* ABOUT + INFO */}
                        <motion.div {...fadeInUp}>
                            <Card className="border-0 bg-white shadow-xl mb-6 overflow-hidden">
                                <CardContent className="p-6">
                                    <p className="text-[#6d4c41] leading-relaxed mb-6">{vendor.description}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div className="flex items-center space-x-3">
                                            <MapPin className="w-5 h-5 text-[#4e342e]" />
                                            <div>
                                                <p className="font-medium text-[#4e342e]">Address</p>
                                                <p className="text-[#6d4c41]">{vendor.address}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Phone className="w-5 h-5 text-[#4e342e]" />
                                            <div>
                                                <p className="font-medium text-[#4e342e]">Phone</p>
                                                <p className="text-[#6d4c41]">{vendor.phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Mail className="w-5 h-5 text-[#4e342e]" />
                                            <div>
                                                <p className="font-medium text-[#4e342e]">Email</p>
                                                <p className="text-[#6d4c41]">{vendor.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Clock className="w-5 h-5 text-[#4e342e]" />
                                            <div>
                                                <p className="font-medium text-[#4e342e]">Next Available</p>
                                                <p className="text-[#6d4c41]">{vendor.nextAvailableSlot}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mb-6 p-4 rounded-lg bg-[#f8d7da] bg-opacity-30 border border-[#f8d7da]">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-[#4e342e] mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-[#4e342e]">What happens after you book?</p>
                                                <p className="text-sm text-[#6d4c41]">Your appointment is saved to this vendor’s dashboard instantly. They can confirm, assign staff, and prepare for your visit.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[#4e342e] mb-3">Working Hours</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(vendor.workingHours).map(([day, hours]) => (
                                                <div key={day} className="flex justify-between text-sm">
                                                    <span className="text-[#4e342e] font-medium">{day}</span>
                                                    <span className="text-[#6d4c41]">{hours}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Services (simplified to resolve parser issue) */}
                        <div className="mt-6">
                            {services.length === 0 ? (
                                <div className="text-center py-12 bg-[#f8d7da] bg-opacity-20 rounded-xl">
                                    <Scissors className="w-16 h-16 text-[#6d4c41] opacity-50 mx-auto mb-4" />
                                    <p className="text-lg font-semibold text-[#4e342e] mb-2">No services available</p>
                                    <p className="text-[#6d4c41]">This vendor hasn't added any services yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {services.map((service) => (
                                        <Card key={service.id} className="border-0 bg-white shadow-lg overflow-hidden flex flex-row">
                                            {service.image && (
                                                <div className="w-1/3 min-w-[120px] max-w-[150px]">
                                                    <img src={service.image} alt={service.name} className="h-full w-full object-cover" />
                                                </div>
                                            )}
                                            <CardContent className="p-4 flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-lg font-semibold text-[#4e342e]">{service.name}</h3>
                                                    <span className="text-lg font-bold text-[#4e342e]">${service.price}</span>
                                                </div>
                                                <p className="text-[#6d4c41] text-sm mb-3 line-clamp-2">{service.description}</p>
                                                <div className="flex items-center justify-between mt-auto">
                                                    <div className="flex items-center space-x-4 text-sm text-[#6d4c41]">
                                                        <span className="flex items-center">
                                                            <Clock className="w-4 h-4 mr-1" />
                                                            {service.duration} min
                                                        </span>
                                                        <Badge variant="secondary">{service.category}</Badge>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => addService(service)}
                                                        className="bg-[#4e342e] hover:bg-[#6d4c41] text-white"
                                                    >
                                                        <Plus className="w-4 h-4 mr-1" />
                                                        Add
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>


                        {/* Products Section */}
                        <div className="mt-8">
                            <h2 className="text-2xl font-serif font-bold text-[#4e342e] mb-6">Products</h2>
                            {products.length === 0 ? (
                                <div className="text-center py-8 bg-[#f8d7da] bg-opacity-20 rounded-xl">
                                    <ShoppingCart className="w-12 h-12 text-[#6d4c41] opacity-50 mx-auto mb-3" />
                                    <p className="text-lg font-semibold text-[#4e342e]">No products available</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {products.map((product) => (
                                        <Card key={product.id} className="border-0 bg-white shadow-lg overflow-hidden flex flex-row">
                                            <div className="w-1/3 min-w-[120px] max-w-[150px]">
                                                <img
                                                    src={product.image || '/api/placeholder/150/150'}
                                                    alt={product.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                            <CardContent className="p-4 flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-lg font-semibold text-[#4e342e]">{product.name}</h3>
                                                    <span className="text-lg font-bold text-[#4e342e]">${product.price}</span>
                                                </div>
                                                <p className="text-[#6d4c41] text-sm mb-3 line-clamp-2">{product.description}</p>
                                                <div className="flex items-center justify-between mt-auto">
                                                    <div className="text-sm text-[#6d4c41]">
                                                        {product.inStock ? (
                                                            <span className="text-green-600 font-medium">In Stock</span>
                                                        ) : (
                                                            <span className="text-red-500 font-medium">Out of Stock</span>
                                                        )}
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            const currentQty = selectedProducts[product.id] || 0;
                                                            updateProductQuantity(product.id, currentQty + 1);
                                                        }}
                                                        disabled={!product.inStock}
                                                        className="bg-[#4e342e] hover:bg-[#6d4c41] text-white"
                                                    >
                                                        <Plus className="w-4 h-4 mr-1" />
                                                        Add
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Booking Summary */}
                    <div className="lg:col-span-1">
                        <motion.div {...fadeInUp}>
                            <Card className="border-0 bg-white shadow-lg sticky top-24">
                                <CardHeader>
                                    <CardTitle className="text-[#4e342e] flex items-center">
                                        <ShoppingCart className="w-5 h-5 mr-2" />
                                        Booking Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {selectedServices.length === 0 && Object.keys(selectedProducts).length === 0 ? (
                                        <p className="text-[#6d4c41] text-center py-8">No items selected</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {selectedServices.map((service) => (
                                                <div key={service.id} className="flex justify-between items-center p-3 bg-[#f8d7da] bg-opacity-20 rounded-lg">
                                                    <div>
                                                        <p className="font-medium text-[#4e342e]">{service.name}</p>
                                                        <p className="text-sm text-[#6d4c41]">{service.duration} min</p>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-semibold text-[#4e342e]">$ {service.price}</span>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => removeService(service.id)}
                                                            className="text-red-500 hover:bg-red-50"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}

                                            {Object.entries(selectedProducts).map(([productId, quantity]) => {
                                                const product = products.find(p => p.id === productId);
                                                if (!product) return null;
                                                return (
                                                    <div key={productId} className="flex justify-between items-center p-3 bg-[#f8d7da] bg-opacity-20 rounded-lg">
                                                        <div>
                                                            <p className="font-medium text-[#4e342e]">{product.name}</p>
                                                            <p className="text-sm text-[#6d4c41]">Qty: {quantity}</p>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="font-semibold text-[#4e342e]">$ {product.price * quantity}</span>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => updateProductQuantity(productId, quantity - 1)}
                                                                className="text-red-500 hover:bg-red-50"
                                                            >
                                                                <Minus className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            <div className="border-t pt-4">
                                                <div className="flex justify-between items-center text-lg font-bold text-[#4e342e]">
                                                    <span>Total</span>
                                                    <span>$ {getTotalPrice()}</span>
                                                </div>
                                            </div>

                                            <Button className="w-full bg-[#4e342e] hover:bg-[#6d4c41] text-white py-3" onClick={proceedToCheckout}>
                                                <Calendar className="w-4 h-4 mr-2" />
                                                Proceed to Booking
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>

    );
};

export default VendorDetailsPage;
