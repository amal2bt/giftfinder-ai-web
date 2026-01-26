import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Search, Edit, Trash2, Gift as GiftIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { giftsApi, type Gift as GiftType } from "@/services/api";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabase = Boolean(supabaseUrl && supabaseKey);
const supabase = hasSupabase ? createClient(supabaseUrl as string, supabaseKey as string) : null as any;

const API_BASE = (import.meta as any).env?.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Predefined gift categories
const GIFT_CATEGORIES = [
  "Clothes",
  "Toys",
  "Electronics",
  "Books",
  "Beauty",
  "Home & Decor",
  "Sports",
  "Food & Beverages",
  "Fragrance",
  "Jewelry",
  "Accessories",
  "Art & Crafts",
  "Music",
  "Gaming",
  "Fitness",
  "Travel",
  "Kitchen",
  "Garden",
  "Pet Supplies",
  "General",
];

const Gifts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [gifts, setGifts] = useState<GiftType[]>([]);
  const { toast } = useToast();

  // Create Gift
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("General");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState("");

  // Edit Gift
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<GiftType | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    giftsApi.list(searchQuery)
      .then(res => {
        if (cancelled) return;
        setGifts(res.gifts || []);
      })
      .catch(err => {
        if (cancelled) return;
        toast({ title: "Failed to load gifts", description: String(err?.message || err), variant: "destructive" });
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [searchQuery, toast]);

  // Create Gift Functions
  const openCreate = () => setIsCreateOpen(true);
  const resetCreateForm = () => {
    setFormName(""); setFormCategory("General"); setFormPrice(""); setFormStock(""); setFormImage("");
    setFormImageFile(null); setFormImagePreview("");
  };

  const submitCreate = async () => {
    try {
      const token = sessionStorage.getItem('auth_token') || sessionStorage.getItem('token');
      if (!token) return toast({ title: "Login required", description: "Please log in as admin to create gifts.", variant: "destructive" });
      if (!formName || !formCategory || formPrice === "" || formStock === "") 
        return toast({ title: "Missing fields", description: "Please fill out all required fields.", variant: "destructive" });

      setCreating(true);
      let imageUrl = formImage;

      if (formImageFile) {
        if (hasSupabase && supabase) {
          const ext = formImageFile.name.split('.').pop();
          const filePath = `${Date.now()}-${Math.round(Math.random()*1e6)}.${ext}`;
          const { error } = await supabase.storage.from('gift-images').upload(filePath, formImageFile, { cacheControl: '3600', upsert: false });
          if (error) throw new Error('Image upload failed');
          imageUrl = `${supabaseUrl}/storage/v1/object/public/gift-images/${filePath}`;
        } else {
          const form = new FormData();
          form.append('name', formName);
          form.append('category', formCategory);
          form.append('price', String(Number(formPrice)));
          form.append('stock', String(Number(formStock)));
          form.append('image', formImageFile);
          const res = await fetch(`${API_BASE}/api/gifts`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
          if (!res.ok) throw new Error(await res.text() || 'Create failed');
          setIsCreateOpen(false); resetCreateForm(); setSearchQuery(q => q); return toast({ title: "Gift created" });
        }
      }

      await giftsApi.create({ name: formName, category: formCategory, price: Number(formPrice), stock: Number(formStock), image: imageUrl || null });
      setIsCreateOpen(false); resetCreateForm(); setSearchQuery(q => q); toast({ title: "Gift created" });
    } catch (err: any) {
      toast({ title: "Create failed", description: String(err?.message || err), variant: "destructive" });
    } finally { setCreating(false); }
  };

  // Edit Gift Functions
  const openEdit = (gift: GiftType) => {
    setEditingGift(gift);
    setEditName(gift.name);
    setEditCategory(gift.category);
    setEditPrice(String(gift.price));
    setEditStock(String(gift.stock));
    setEditImage(gift.image || "");
    setEditImagePreview(gift.image || "");
    setIsEditOpen(true);
  };

  // Get categories list including the current edit category if it's not in the predefined list
  const getCategoriesForEdit = () => {
    if (editingGift && !GIFT_CATEGORIES.includes(editingGift.category)) {
      return [editingGift.category, ...GIFT_CATEGORIES];
    }
    return GIFT_CATEGORIES;
  };

  const submitEdit = async () => {
    if (!editingGift) return;
    try {
      const token = sessionStorage.getItem('auth_token') || sessionStorage.getItem('token');
      if (!token) return toast({ title: "Login required", description: "Please log in as admin to edit gifts.", variant: "destructive" });

      let imageUrl = editImage;
      if (editImageFile && hasSupabase && supabase) {
        const ext = editImageFile.name.split('.').pop();
        const filePath = `${Date.now()}-${Math.round(Math.random()*1e6)}.${ext}`;
        const { error } = await supabase.storage.from('gift-images').upload(filePath, editImageFile, { cacheControl: '3600', upsert: false });
        if (error) throw new Error('Image upload failed');
        imageUrl = `${supabaseUrl}/storage/v1/object/public/gift-images/${filePath}`;
      }

      await giftsApi.update(editingGift.id, { name: editName, category: editCategory, price: Number(editPrice), stock: Number(editStock), image: imageUrl || null });
      setGifts(prev => prev.map(g => g.id === editingGift.id ? { ...g, name: editName, category: editCategory, price: Number(editPrice), stock: Number(editStock), image: imageUrl || null } : g));
      setIsEditOpen(false);
      toast({ title: "Gift updated" });
    } catch (err: any) {
      toast({ title: "Update failed", description: String(err?.message || err), variant: "destructive" });
    }
  };

  const handleDeleteGift = async (id: number) => {
    try {
      const token = sessionStorage.getItem('auth_token') || sessionStorage.getItem('token');
      if (!token) return toast({ title: "Login required", description: "Please log in as admin to delete gifts.", variant: "destructive" });
      if (!window.confirm("Delete this gift?")) return;
      await giftsApi.remove(id);
      setGifts(prev => prev.filter(g => g.id !== id));
      toast({ title: "Gift deleted" });
    } catch (err: any) {
      toast({ title: "Delete failed", description: String(err?.message || err), variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">Gift Management</h1>
            <p className="text-muted-foreground mt-2">Add, edit, and manage all your gift items</p>
          </div>
          <Button onClick={openCreate} className="gradient-primary text-white shadow-soft hover:shadow-glow transition-all">
            <Plus className="mr-2 h-4 w-4" /> Add New Gift
          </Button>
        </div>

        {/* Create Gift Modal */}
        <Dialog open={isCreateOpen} onOpenChange={(o) => { setIsCreateOpen(o); if (!o) resetCreateForm(); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Gift</DialogTitle>
              <DialogDescription>Enter the details below to add a new gift.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="L'IMAGE" /></div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {GIFT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Price</Label><Input type="number" value={formPrice} onChange={e => setFormPrice(e.target.value)} placeholder="49.99" /></div>
                <div className="space-y-2"><Label>Stock</Label><Input type="number" value={formStock} onChange={e => setFormStock(e.target.value)} placeholder="100" /></div>
              </div>
              <div className="space-y-2">
                <Label>Image (emoji or URL/path)</Label>
                <Input value={formImage} onChange={e => setFormImage(e.target.value)} placeholder="🎁 or /images/perfume.jpg" />
                {formImagePreview && <img src={formImagePreview} alt="Preview" className="mt-2 h-20 w-20 rounded object-cover" />}
              </div>
              <Input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; setFormImageFile(f || null); setFormImagePreview(f ? URL.createObjectURL(f) : ""); }} />
            </div>
            <DialogFooter className="mt-4 flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setIsCreateOpen(false)} disabled={creating}>Cancel</Button>
              <Button onClick={submitCreate} disabled={creating} className="gradient-primary text-white">{creating ? "Creating..." : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Gift Modal */}
        <Dialog open={isEditOpen} onOpenChange={(o) => { setIsEditOpen(o); if (!o) setEditingGift(null); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Gift</DialogTitle>
              <DialogDescription>Update the gift details below.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCategoriesForEdit().map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Price</Label><Input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} /></div>
                <div className="space-y-2"><Label>Stock</Label><Input type="number" value={editStock} onChange={e => setEditStock(e.target.value)} /></div>
              </div>
              <div className="space-y-2">
                <Label>Image (emoji or URL/path)</Label>
                <Input value={editImage} onChange={e => setEditImage(e.target.value)} />
                {editImagePreview && <img src={editImagePreview} alt="Preview" className="mt-2 h-20 w-20 rounded object-cover" />}
              </div>
              <Input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; setEditImageFile(f || null); setEditImagePreview(f ? URL.createObjectURL(f) : editImage); }} />
            </div>
            <DialogFooter className="mt-4 flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={submitEdit} className="gradient-primary text-white">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search gifts..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-card/50 border-border" />
        </div>

        {/* Gifts Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {gifts.map(gift => (
            <Card key={gift.id} className="glass-card p-6 shadow-soft hover:shadow-glow transition-all">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl gradient-secondary text-4xl">
                    {typeof gift.image === "string" && (gift.image.startsWith("http") || gift.image.startsWith("/")) ? (
                      <img src={gift.image} alt={gift.name} className="h-16 w-16 rounded-xl object-cover" />
                    ) : gift.image || "🎁"}
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(gift)} className="h-8 w-8 hover:bg-secondary">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteGift(gift.id)} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{gift.name}</h3>
                  <p className="text-sm text-muted-foreground">{gift.category}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <p className="text-xl font-bold text-primary">${typeof gift.price === 'number' ? gift.price.toFixed(2) : gift.price}</p>
                    <p className="text-xs text-muted-foreground">In stock: {gift.stock}</p>
                  </div>
                  <GiftIcon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Gifts;
