import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Plus,
  Edit,
  Trash2,
  Clock,
  DollarSign,
  Scissors,
  Palette,
  Sparkles,
  Award,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  isActive: boolean;
  image?: string;
  tags?: string[];
  genderPreference?: string;
  createdAt: string;
  updatedAt: string;
}

const ServicesPage = () => {
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryOptions = [
    { value: 'hair', label: 'Hair Care', icon: Scissors },
    { value: 'face', label: 'Face Care', icon: Palette },
    { value: 'nail', label: 'Nail Care', icon: Sparkles },
    { value: 'spa', label: 'Spa & Wellness', icon: Award },
    { value: 'makeup', label: 'Makeup', icon: Palette }
  ];

  useEffect(() => {
    fetchServices();
  }, [user?.id]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Using the public endpoint might be easier if it returns everything, 
      // but let's stick to the vendor specific one to ensure we get inactive ones too if needed
      // Actually /api/vendor/:id/services returns everything for that vendor
      const response = await fetch(`http://localhost:3001/api/vendor/${user?.id}/services`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/vendor/${user?.id}/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Service deleted successfully!');
        fetchServices();
      } else {
        toast.error('Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    }
  };

  const getCategoryIcon = (category: string) => {
    // Basic normalization
    const normalized = (category || '').toLowerCase();
    const categoryData = categoryOptions.find(cat => normalized.includes(cat.value));
    return categoryData?.icon || Sparkles;
  };

  const getCategoryLabel = (category: string) => {
    // Just return the raw category name if it doesn't match predefined ones, nicely capitalized
    const normalized = (category || '').toLowerCase();
    const categoryData = categoryOptions.find(cat => normalized.includes(cat.value));
    return categoryData?.label || category || 'Other';
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <motion.div {...fadeInUp}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold text-[#4e342e] mb-2">Services Management</h1>
              <p className="text-[#6d4c41]">Manage your salon services and pricing</p>
            </div>
            <Button
              onClick={() => navigate('/vendor/services/add')}
              className="bg-[#4e342e] hover:bg-[#3b2c26] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </div>

          {/* Services Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-0 bg-white shadow-lg animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : services.length === 0 ? (
            <Card className="border-0 bg-white shadow-lg">
              <CardContent className="p-12 text-center">
                <Sparkles className="w-16 h-16 text-[#6d4c41]/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#4e342e] mb-2">No Services Yet</h3>
                <p className="text-[#6d4c41] mb-6">Start by adding your first service to begin accepting bookings.</p>
                <Button
                  onClick={() => navigate('/vendor/services/add')}
                  className="bg-[#4e342e] hover:bg-[#3b2c26] text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Service
                </Button>
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
                    <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col overflow-hidden group">
                      {/* Image Thumbnail */}
                      <div className="relative h-48 bg-gray-100 overflow-hidden">
                        {service.image ? (
                          <img
                            src={service.image}
                            alt={service.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#fdf6f0]">
                            <ImageIcon className="w-12 h-12 text-[#d7ccc8]" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge className={service.isActive ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'}>
                            {service.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>

                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 bg-[#fdf6f0] rounded-md">
                              <CategoryIcon className="w-4 h-4 text-[#4e342e]" />
                            </div>
                            <Badge variant="outline" className="text-xs font-normal border-[#d7ccc8] text-[#6d4c41]">
                              {getCategoryLabel(service.category)}
                            </Badge>
                          </div>
                        </div>
                        <CardTitle className="text-lg text-[#4e342e] mt-2 line-clamp-1">{service.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col justify-between">
                        <p className="text-[#6d4c41] text-sm mb-4 line-clamp-2">{service.description}</p>

                        <div>
                          <div className="flex items-center justify-between text-sm mb-4">
                            <div className="flex items-center space-x-1 text-[#4e342e] font-semibold">
                              <DollarSign className="w-4 h-4" />
                              <span>{service.price}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-[#6d4c41]">
                              <Clock className="w-4 h-4" />
                              <span>{service.duration} min</span>
                            </div>
                          </div>

                          <div className="flex space-x-2 pt-2 border-t border-[#fdf6f0]">
                            <Button
                              variant="outline"
                              className="flex-1 border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white"
                              onClick={() => navigate(`/vendor/services/edit/${service.id}`)}
                            >
                              <Edit className="w-3 h-3 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              className="text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleDelete(service.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default ServicesPage;
