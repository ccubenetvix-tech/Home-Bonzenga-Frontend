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
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  DollarSign,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { supabaseCatalog, type CatalogProduct } from '@/lib/supabaseCatalog';

const AtHomeProductsPage = () => {
  const { user } = useSupabaseAuth();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    image: '',
    customerPrice: 0,
    vendorPayout: 0,
    sku: '',
    isActive: true
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const result = await supabaseCatalog.getProducts({ showInactive: true });
      if (result.success && result.data) {
        setProducts(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch products');
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error(error.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      image: '',
      customerPrice: 0,
      vendorPayout: 0,
      sku: '',
      isActive: true
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (product: CatalogProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      image: product.image || '',
      customerPrice: product.customerPrice,
      vendorPayout: product.vendorPayout,
      sku: product.sku || '',
      isActive: product.isActive
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
      if (editingProduct) {
        const result = await supabaseCatalog.updateProduct(editingProduct.id, {
          name: formData.name,
          description: formData.description || null,
          category: formData.category || null,
          image: formData.image || null,
          customerPrice: formData.customerPrice,
          vendorPayout: formData.vendorPayout,
          sku: formData.sku || null,
          isActive: formData.isActive
        });
        if (result.success) {
          toast.success('Product updated successfully');
          setIsDialogOpen(false);
          fetchProducts();
        } else {
          throw new Error(result.error || 'Failed to update product');
        }
      } else {
        const result = await supabaseCatalog.createProduct(formData);
        if (result.success) {
          toast.success('Product created successfully');
          setIsDialogOpen(false);
          fetchProducts();
        } else {
          throw new Error(result.error || 'Failed to create product');
        }
      }
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const result = await supabaseCatalog.deleteProduct(id);
      if (result.success) {
        toast.success('Product deleted successfully');
        fetchProducts();
      } else {
        throw new Error(result.error || 'Failed to delete product');
      }
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const handleToggleStatus = async (product: CatalogProduct) => {
    try {
      const result = await supabaseCatalog.updateProduct(product.id, { isActive: !product.isActive });
      if (result.success) {
        toast.success(`Product ${!product.isActive ? 'activated' : 'deactivated'}`);
        fetchProducts();
      } else {
        throw new Error(result.error || 'Failed to update product status');
      }
    } catch (error: any) {
      console.error('Error updating product status:', error);
      toast.error(error.message || 'Failed to update product status');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && product.isActive) ||
      (statusFilter === 'inactive' && !product.isActive);
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = ['Hair', 'Skin', 'Makeup', 'Nail', 'General'];
  const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-[#4e342e] mb-2">
            At-Home Products Management
          </h1>
          <p className="text-[#6d4c41]">Manage catalog products for at-home bookings</p>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6d4c41] w-5 h-5" />
                <Input
                  placeholder="Search products..."
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
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAdd}
                className="bg-[#4e342e] hover:bg-[#3b2c26] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Product
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Products List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#4e342e]" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-[#6d4c41] mx-auto mb-4" />
              <p className="text-xl font-semibold text-[#4e342e] mb-2">No products found</p>
              <p className="text-[#6d4c41]">Create your first at-home product to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-serif text-[#4e342e]">
                      {product.name}
                    </CardTitle>
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {product.category && (
                    <Badge variant="outline" className="mt-2">
                      {product.category}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  {product.image && (
                    <div className="mb-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <p className="text-sm text-[#6d4c41] mb-4 line-clamp-2">
                    {product.description || 'No description'}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-[#6d4c41]">
                      <DollarSign className="w-4 h-4" />
                      <span>Customer: {product.customerPrice.toLocaleString()} CDF</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#6d4c41]">
                      <DollarSign className="w-4 h-4" />
                      <span>Vendor: {product.vendorPayout.toLocaleString()} CDF</span>
                    </div>
                    {product.sku && (
                      <div className="text-xs text-[#6d4c41]">
                        SKU: {product.sku}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(product)}
                      className="flex-1"
                    >
                      {product.isActive ? (
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
                      onClick={() => handleDelete(product.id)}
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
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-[#4e342e]">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Professional Hair Shampoo"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-[#4e342e]">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Product description..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <Label htmlFor="sku" className="text-[#4e342e]">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Product SKU"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="image" className="text-[#4e342e]">Image URL</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-[#4e342e] hover:bg-[#3b2c26] text-white"
              >
                {editingProduct ? 'Update' : 'Create'} Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AtHomeProductsPage;

