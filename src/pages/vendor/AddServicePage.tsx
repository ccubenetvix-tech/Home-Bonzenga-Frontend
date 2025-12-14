import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryDropdown } from '@/components/CategoryDropdown';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Upload, X } from 'lucide-react';

interface Category {
    id: string;
    name: string;
}

const AddServicePage = () => {
    const navigate = useNavigate();
    const { user } = useSupabaseAuth();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        duration: '60',
        categoryId: '',
        tags: '', // Comma separated
        genderPreference: 'UNISEX'
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/vendor/categories');
            if (response.ok) {
                const data = await response.json();
                setCategories(data.categories || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const objectUrl = URL.createObjectURL(file);
            setImagePreview(objectUrl);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
    };

    const uploadImage = async (file: File): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `service-images/${fileName}`; // Changed to service-images folder in vendor-services bucket if desired, or simplified

        // Use vendor-services bucket as per plan
        const { error: uploadError } = await supabase.storage
            .from('vendor-services')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('vendor-services')
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!user?.id) throw new Error('Not authenticated');
            if (!formData.categoryId) throw new Error('Please select a category');
            if (!imageFile) throw new Error('Service image is required');

            // 1. Upload Image
            const imageUrl = await uploadImage(imageFile);

            // 2. Prepare Payload
            const payload = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                duration: parseInt(formData.duration),
                categoryId: formData.categoryId,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                genderPreference: formData.genderPreference,
                image: imageUrl
            };

            // 3. Send to API
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/api/vendor/${user.id}/services`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create service');
            }

            toast.success('Service created successfully!');
            navigate('/vendor/services');

        } catch (error: any) {
            console.error('Error creating service:', error);
            toast.error(error.message || 'Failed to create service');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/vendor/services')}
                    className="mb-6 hover:bg-transparent pl-0 text-[#6d4c41] hover:text-[#4e342e]"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Services
                </Button>

                <Card className="max-w-3xl mx-auto border-0 shadow-lg bg-white">
                    <CardHeader>
                        <CardTitle className="text-2xl font-serif text-[#4e342e]">Add New Service</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Image Upload */}
                            <div className="space-y-2">
                                <Label className="text-[#4e342e]">Service Image (Required)</Label>
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] relative bg-gray-50">
                                    {imagePreview ? (
                                        <div className="relative w-full h-full flex justify-center">
                                            <img src={imagePreview} alt="Preview" className="max-h-[300px] object-cover rounded-md" />
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500 mb-2">Click to upload or drag and drop</p>
                                            <p className="text-xs text-gray-400">JPG, PNG up to 5MB</p>
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                required
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-[#4e342e]">Service Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Luxury Haircut"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category" className="text-[#4e342e]">Category</Label>
                                    <CategoryDropdown
                                        categories={categories}
                                        selectedId={formData.categoryId}
                                        onSelect={(id) => setFormData({ ...formData, categoryId: id })}
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-[#4e342e]">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe the service..."
                                    rows={4}
                                    required
                                />
                            </div>

                            {/* Pricing & Time */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-[#4e342e]">Price ($)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="duration" className="text-[#4e342e]">Duration (minutes)</Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        value={formData.duration}
                                        onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                        placeholder="60"
                                        min="15"
                                        step="15"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="gender" className="text-[#4e342e]">Gender Preference</Label>
                                    <Select
                                        value={formData.genderPreference}
                                        onValueChange={val => setFormData({ ...formData, genderPreference: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="UNISEX">Unisex</SelectItem>
                                            <SelectItem value="MEN">Men Only</SelectItem>
                                            <SelectItem value="WOMEN">Women Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tags" className="text-[#4e342e]">Tags (Optional)</Label>
                                    <Input
                                        id="tags"
                                        value={formData.tags}
                                        onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                        placeholder="e.g. hair, styling, organic"
                                    />
                                    <p className="text-xs text-gray-500">Comma separated</p>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end pt-4">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-[#4e342e] hover:bg-[#3b2c26] text-white min-w-[150px]"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Create Service
                                </Button>
                            </div>

                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default AddServicePage;
