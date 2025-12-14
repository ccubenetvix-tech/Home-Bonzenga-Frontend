import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Scissors,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  CheckCircle,
  XCircle,
  DollarSign,
  Clock,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { supabaseCatalog, type CatalogService } from '@/lib/supabaseCatalog';

const AtHomeServicesPage = () => {
  const { user } = useSupabaseAuth();
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<CatalogService | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 60,
    customerPrice: 0,
    vendorPayout: 0,
    category: '',
    icon: '',
    allowsProducts: false,
    isActive: true
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const result = await supabaseCatalog.getServices({ showInactive: true });
      if (result.success && result.data) {
        setServices(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch services');
      }
    } catch (error: any) {
      console.error('Error fetching services:', error);
      toast.error(error.message || 'Failed to load services');
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      duration: 60,
      customerPrice: 0,
      vendorPayout: 0,
      category: '',
      icon: '',
      allowsProducts: false,
      isActive: true
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (service: CatalogService) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      duration: service.duration,
      customerPrice: service.customerPrice,
      vendorPayout: service.vendorPayout,
      category: service.category || '',
      icon: service.icon || '',
      allowsProducts: service.allowsProducts,
      isActive: service.isActive
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.customerPrice || !formData.vendorPayout) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.vendorPayout > formData.customerPrice) {
      toast.error('Vendor payout cannot exceed customer price');
      return;
    }

    try {
      if (editingService) {
        const result = await supabaseCatalog.updateService(editingService.id, {
          name: formData.name,
          description: formData.description || null,
          duration: formData.duration,
          customerPrice: formData.customerPrice,
          vendorPayout: formData.vendorPayout,
          category: formData.category || null,
          icon: formData.icon || null,
          allowsProducts: formData.allowsProducts,
          isActive: formData.isActive
        });
        if (result.success) {
          toast.success('Service updated successfully');
          setIsDialogOpen(false);
          fetchServices();
        } else {
          throw new Error(result.error || 'Failed to update service');
        }
      } else {
        const result = await supabaseCatalog.createService(formData);
        if (result.success) {
          toast.success('Service created successfully');
          setIsDialogOpen(false);
          fetchServices();
        } else {
          throw new Error(result.error || 'Failed to create service');
        }
      }
    } catch (error: any) {
      console.error('Error saving service:', error);
      toast.error(error.message || 'Failed to save service');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      const result = await supabaseCatalog.deleteService(id);
      if (result.success) {
        toast.success('Service deleted successfully');
        fetchServices();
      } else {
        throw new Error(result.error || 'Failed to delete service');
      }
    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast.error(error.message || 'Failed to delete service');
    }
  };

  const handleToggleStatus = async (service: CatalogService) => {
    try {
      const result = await supabaseCatalog.updateService(service.id, { isActive: !service.isActive });
      if (result.success) {
        toast.success(`Service ${!service.isActive ? 'activated' : 'deactivated'}`);
        fetchServices();
      } else {
        throw new Error(result.error || 'Failed to update service status');
      }
    } catch (error: any) {
      console.error('Error updating service status:', error);
      toast.error(error.message || 'Failed to update service status');
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && service.isActive) ||
      (statusFilter === 'inactive' && !service.isActive);
    return matchesSearch && matchesStatus;
  });

  const categories = ['Hair', 'Skin', 'Makeup', 'Nail', 'General'];

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-[#4e342e] mb-2">
            At-Home Services Management
          </h1>
          <p className="text-[#6d4c41]">Manage catalog services for at-home bookings</p>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6d4c41] w-5 h-5" />
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleAdd}
                className="bg-[#4e342e] hover:bg-[#3b2c26] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Service
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Services List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#4e342e]" />
          </div>
        ) : filteredServices.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Scissors className="w-16 h-16 text-[#6d4c41] mx-auto mb-4" />
              <p className="text-xl font-semibold text-[#4e342e] mb-2">No services found</p>
              <p className="text-[#6d4c41]">Create your first at-home service to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card key={service.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-serif text-[#4e342e]">
                      {service.name}
                    </CardTitle>
                    <Badge variant={service.isActive ? "default" : "secondary"}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {service.category && (
                    <Badge variant="outline" className="mt-2">
                      {service.category}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#6d4c41] mb-4 line-clamp-2">
                    {service.description || 'No description'}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-[#6d4c41]">
                      <Clock className="w-4 h-4" />
                      <span>{service.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#6d4c41]">
                      <DollarSign className="w-4 h-4" />
                      <span>Customer: {service.customerPrice.toLocaleString()} CDF</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#6d4c41]">
                      <DollarSign className="w-4 h-4" />
                      <span>Vendor: {service.vendorPayout.toLocaleString()} CDF</span>
                    </div>
                    {service.allowsProducts && (
                      <div className="flex items-center gap-2 text-sm text-[#6d4c41]">
                        <Package className="w-4 h-4" />
                        <span>Allows Products</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(service)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(service)}
                      className="flex-1"
                    >
                      {service.isActive ? (
                        <>
                          <XCircle className="w-4 h-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(service.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif text-[#4e342e]">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-[#4e342e]">Service Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Professional Hair Styling"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-[#4e342e]">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Service description..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration" className="text-[#4e342e]">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="text-[#4e342e]">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerPrice" className="text-[#4e342e]">Customer Price (CDF) *</Label>
                  <Input
                    id="customerPrice"
                    type="number"
                    value={formData.customerPrice}
                    onChange={(e) => setFormData({ ...formData, customerPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="vendorPayout" className="text-[#4e342e]">Vendor Payout (CDF) *</Label>
                  <Input
                    id="vendorPayout"
                    type="number"
                    value={formData.vendorPayout}
                    onChange={(e) => setFormData({ ...formData, vendorPayout: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allowsProducts"
                    checked={formData.allowsProducts}
                    onChange={(e) => setFormData({ ...formData, allowsProducts: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="allowsProducts" className="text-[#4e342e]">Allows Products</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="isActive" className="text-[#4e342e]">Active</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-[#4e342e] hover:bg-[#3b2c26] text-white"
              >
                {editingService ? 'Update' : 'Create'} Service
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AtHomeServicesPage;

