import React, { useState, useEffect } from 'react';
import { adminApi } from '@/lib/adminApi';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Loader2,
  Search,
  Plus,
  Package,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface VendorProductReference {
  name: string;
  price: number;
  vendor_name: string;
}

interface AdminProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_active: boolean;
}

const AtHomeProductsPage = () => {
  // Vendor Reference State
  const [vendorProducts, setVendorProducts] = useState<VendorProductReference[]>([]);
  const [refSearch, setRefSearch] = useState('');
  const [loadingRef, setLoadingRef] = useState(true);

  // Admin Catalog State
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    is_active: true
  });

  useEffect(() => {
    fetchVendorReference();
    fetchAdminCatalog();
  }, []);

  const fetchVendorReference = async () => {
    try {
      setLoadingRef(true);
      const response = await adminApi.get<any>('/admin/vendor-catalog/products');
      if (response.success && response.data) {
        setVendorProducts(response.data);
      } else {
        console.error('Error fetching vendor reference:', response.message);
        toast.error(response.message || 'Failed to load vendor product references');
      }
    } catch (error) {
      console.error('Error fetching vendor reference:', error);
      toast.error('Failed to load vendor product references');
    } finally {
      setLoadingRef(false);
    }
  };

  const fetchAdminCatalog = async () => {
    try {
      setLoadingAdmin(true);
      const response = await adminApi.get<any>('/admin/athome/products');
      if (response.success && response.data && response.data.success) {
        setAdminProducts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching admin catalog:', error);
    } finally {
      setLoadingAdmin(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const response = await adminApi.post<any>('/admin/athome/products', formData);

      if (response.success && response.data && response.data.success) {
        toast.success('Product added to Master Catalog');
        setFormData({
          name: '',
          description: '',
          price: '',
          image_url: '',
          is_active: true
        });
        fetchAdminCatalog();
      } else {
        toast.error(response.message || response.data?.message || 'Failed to add product');
      }
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRef = vendorProducts.filter(p =>
    p.name.toLowerCase().includes(refSearch.toLowerCase()) ||
    p.vendor_name.toLowerCase().includes(refSearch.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4 h-full flex flex-col">
        <div className="mb-6">
          <h1 className="text-3xl font-serif font-bold text-[#4e342e]">
            At-Home Products - Master Catalog
          </h1>
          <p className="text-[#6d4c41]">Standardize products that can be bundled with at-home services.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 flex-grow">
          {/* LEFT PANEL: Vendor Reference (READ ONLY) */}
          <div className="lg:w-1/2 flex flex-col">
            <Card className="border-0 shadow-xl bg-white/50 backdrop-blur-sm flex-grow">
              <CardHeader className="border-b border-[#f8d7da]/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-serif text-[#4e342e] flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-[#6d4c41]" />
                    Vendor Products Reference
                  </CardTitle>
                  <Badge variant="outline" className="bg-[#fdf6f0] text-[#6d4c41]">READ ONLY</Badge>
                </div>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6d4c41]" />
                  <Input
                    placeholder="Search vendor products..."
                    className="pl-10 bg-white"
                    value={refSearch}
                    onChange={(e) => setRefSearch(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-auto max-h-[600px]">
                {loadingRef ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#4e342e]" />
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-[#fdf6f0] sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-sm font-bold text-[#4e342e]">Product Name</th>
                        <th className="px-4 py-3 text-sm font-bold text-[#4e342e]">Price</th>
                        <th className="px-4 py-3 text-sm font-bold text-[#4e342e]">Vendor</th>
                        <th className="px-4 py-3 text-sm font-bold text-[#4e342e] text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f8d7da]/20">
                      {filteredRef.map((p, idx) => (
                        <tr key={idx} className="hover:bg-white/40 transition-colors group">
                          <td className="px-4 py-3 font-medium text-[#4e342e]">
                            {p.name}
                          </td>
                          <td className="px-4 py-3 text-[#4e342e] font-serif">
                            {p.price?.toLocaleString()} CDF
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-[#6d4c41]">
                            {p.vendor_name}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  name: p.name,
                                  price: p.price?.toString() || ''
                                });
                                toast.info('Copied details to form');
                              }}
                            >
                              <Plus className="w-4 h-4 mr-1" /> Use
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {filteredRef.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-12 text-center text-[#6d4c41]">
                            No vendor products found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT PANEL: Admin Form (WRITE) */}
          <div className="lg:w-1/2 flex flex-col gap-6">
            <Card className="border-0 shadow-xl bg-white overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#4e342e] to-[#6d4c41] text-white">
                <CardTitle className="text-xl font-serif font-bold">Add Master Product</CardTitle>
                <p className="text-[#f8d7da] text-sm">Create a standardized product for all at-home bookings.</p>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pname">Product Name *</Label>
                    <Input
                      id="pname"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Premium Scalp Treatment Oil"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pprice">Platform Price (CDF) *</Label>
                      <Input
                        id="pprice"
                        type="number"
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pimage">Image URL</Label>
                      <Input
                        id="pimage"
                        value={formData.image_url}
                        onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="Paste product image URL (https://...)"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pdesc">Description</Label>
                    <Textarea
                      id="pdesc"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Product details, brand info, and highlights..."
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="pactive"
                      checked={formData.is_active}
                      onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 accent-[#4e342e]"
                    />
                    <Label htmlFor="pactive" className="cursor-pointer">Active and Available</Label>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#4e342e] hover:bg-[#3b2c26] text-white py-6 text-lg font-bold shadow-lg"
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Package className="w-5 h-5 mr-2" />}
                    Add to Platform Products
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* LIST OF EXISTING MASTER PRODUCTS */}
            <Card className="border-0 shadow-lg bg-[#fdf6f0]/50 flex-grow">
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-[#f8d7da]/20">
                <CardTitle className="text-sm font-bold text-[#4e342e]">Live Master Catalog</CardTitle>
                <div className="text-xs text-[#6d4c41] font-medium">{adminProducts.length} Products</div>
              </CardHeader>
              <CardContent className="p-0 overflow-auto max-h-[300px]">
                <div className="divide-y divide-[#f8d7da]/10">
                  {adminProducts.map(p => (
                    <div key={p.id} className="p-3 flex items-center justify-between hover:bg-white/40">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-white border border-[#f8d7da]/30 flex items-center justify-center overflow-hidden">
                          {p.image_url ? (
                            <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-[#6d4c41]" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#4e342e]">{p.name}</p>
                          <p className="text-[10px] text-[#6d4c41] line-clamp-1">{p.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-serif font-bold text-[#4e342e]">{p.price?.toLocaleString()} CDF</p>
                        <Badge variant={p.is_active ? "default" : "secondary"} className="text-[10px] py-0">
                          {p.is_active ? 'Active' : 'Hidden'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {adminProducts.length === 0 && !loadingAdmin && (
                    <div className="p-8 text-center text-xs text-[#6d4c41]">Catalog is empty.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AtHomeProductsPage;

function Badge({ children, variant = "default", className = "" }: { children: React.ReactNode, variant?: "default" | "secondary" | "outline", className?: string }) {
  const styles = {
    default: "bg-[#4e342e] text-white",
    secondary: "bg-[#f8d7da] text-[#4e342e]",
    outline: "border border-[#4e342e] text-[#4e342e]"
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}
