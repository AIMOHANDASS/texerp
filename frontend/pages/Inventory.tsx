
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Product, Category } from '../types';
import anime from 'animejs';

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchProducts = async () => {
    const data = await api.getProducts();
    setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      (anime as any)({
        targets: '.inventory-row',
        opacity: [0, 1],
        translateY: [10, 0],
        delay: anime.stagger(40),
        easing: 'easeOutQuad',
        duration: 600
      });
    }
  }, [products, searchTerm, categoryFilter]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreviewImage(base64);
        if (editingProduct) {
          setEditingProduct({ ...editingProduct, image: base64 });
        } else {
           (window as any)._tempImg = base64;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productData: Partial<Product> = {
      id: editingProduct?.id,
      name: formData.get('name') as string,
      category: formData.get('category') as Category,
      sku: formData.get('sku') as string,
      variant: formData.get('variant') as string,
      costPrice: Number(formData.get('costPrice')),
      sellingPrice: Number(formData.get('sellingPrice')),
      stock: Number(formData.get('stock')),
      description: formData.get('description') as string,
      image: previewImage || editingProduct?.image || (window as any)._tempImg || `https://picsum.photos/seed/${Date.now()}/400/400`
    };
    
    await api.saveProduct(productData);
    await fetchProducts();
    setIsModalOpen(false);
    setEditingProduct(null);
    setPreviewImage(null);
    delete (window as any)._tempImg;
  };

  const openModal = (product: Product | null) => {
    setEditingProduct(product);
    setPreviewImage(product?.image || null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Product Inventory</h2>
          <p className="text-slate-500 font-medium">Manage and track your textile catalog.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => api.downloadReport('inventory', filteredProducts)} className="px-6 py-3 glass-card bg-white/40 border border-white/60 rounded-2xl font-bold text-slate-600 hover:bg-white transition-all">
            Export CSV
          </button>
          <button onClick={() => openModal(null)} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
            + New Product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/50 p-4 rounded-[2rem] border border-white/60 shadow-sm">
        <div className="md:col-span-3 relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5"/></svg>
          <input 
            type="text" 
            placeholder="Search by product name or SKU..." 
            className="w-full pl-12 pr-4 py-4 bg-transparent border-none outline-none font-bold text-slate-700 placeholder:text-slate-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="w-full px-6 py-4 bg-transparent border-none outline-none font-black text-slate-600 text-xs uppercase tracking-widest"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="All">All Categories</option>
          {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/60">
        <table className="w-full text-left">
          <thead className="bg-slate-50/30 border-b border-white/60">
            <tr>
              <th className="px-10 py-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Product Details</th>
              <th className="px-10 py-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">SKU</th>
              <th className="px-10 py-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</th>
              <th className="px-10 py-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Pricing (INR)</th>
              <th className="px-10 py-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Stock Level</th>
              <th className="px-10 py-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20">
            {filteredProducts.map(p => (
              <tr key={p.id} className="inventory-row hover:bg-white/40 transition-colors">
                <td className="px-10 py-6">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-[1.25rem] bg-slate-100 overflow-hidden shadow-sm border border-white">
                      <img src={p.image} className="h-full w-full object-cover" alt={p.name} />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-lg leading-tight">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{p.variant || 'Standard'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-6 text-sm font-bold text-slate-500">{p.sku}</td>
                <td className="px-10 py-6">
                  <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 font-black text-[9px] uppercase tracking-widest">{p.category}</span>
                </td>
                <td className="px-10 py-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Buy: <span className="text-slate-600">₹{p.costPrice}</span></span>
                    <span className="text-sm font-black text-emerald-600 uppercase tracking-tighter">Sell: <span className="text-base">₹{p.sellingPrice}</span></span>
                  </div>
                </td>
                <td className="px-10 py-6">
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${p.stock < 10 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${p.stock < 10 ? 'bg-rose-600 animate-pulse' : 'bg-emerald-600'}`}></div>
                    {p.stock} in inventory
                  </div>
                </td>
                <td className="px-10 py-6 text-right">
                  <div className="flex justify-end gap-3">
                    <button onClick={() => openModal(p)} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Edit</button>
                    <button onClick={() => window.confirm("Delete?") && api.deleteProduct(p.id).then(fetchProducts)} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xl">
          <div className="bg-white/90 glass-card rounded-[3rem] w-full max-w-2xl p-12 shadow-3xl animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <h3 className="text-4xl font-black text-slate-900 mb-10 tracking-tighter">{editingProduct ? 'Edit Catalog Item' : 'New Catalog Item'}</h3>
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <input name="name" placeholder="Product Title" defaultValue={editingProduct?.name} required className="w-full px-8 py-5 glass-input rounded-3xl font-extrabold text-slate-800 placeholder:text-slate-300" />
              </div>
              <div>
                <select name="category" defaultValue={editingProduct?.category} className="w-full px-8 py-5 glass-input rounded-3xl font-extrabold text-slate-800 appearance-none">
                  {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <input name="sku" placeholder="SKU ID" defaultValue={editingProduct?.sku} required className="w-full px-8 py-5 glass-input rounded-3xl font-extrabold text-slate-800 placeholder:text-slate-300" />
              </div>
              <div className="col-span-2">
                <input name="variant" placeholder="Variant (e.g. Linen Blue / Large)" defaultValue={editingProduct?.variant} className="w-full px-8 py-5 glass-input rounded-3xl font-extrabold text-slate-800 placeholder:text-slate-300" />
              </div>
              <div className="grid grid-cols-3 col-span-2 gap-6">
                <input type="number" name="costPrice" placeholder="Cost" defaultValue={editingProduct?.costPrice} required className="px-8 py-5 glass-input rounded-3xl font-extrabold text-slate-800" />
                <input type="number" name="sellingPrice" placeholder="Retail" defaultValue={editingProduct?.sellingPrice} required className="px-8 py-5 glass-input rounded-3xl font-extrabold text-slate-800" />
                <input type="number" name="stock" placeholder="Initial Qty" defaultValue={editingProduct?.stock} required className="px-8 py-5 glass-input rounded-3xl font-extrabold text-slate-800" />
              </div>
              <div className="col-span-2">
                <textarea name="description" placeholder="Product Details..." defaultValue={editingProduct?.description} className="w-full px-8 py-5 glass-input rounded-3xl font-extrabold text-slate-800 min-h-[100px]"></textarea>
              </div>
              <div className="col-span-2">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="file-upload" />
                <div className="flex flex-col items-center gap-4">
                  {previewImage && (
                    <div className="relative w-full h-48 rounded-3xl overflow-hidden border border-slate-200 shadow-inner">
                      <img src={previewImage} className="w-full h-full object-cover" alt="Preview" />
                      <button 
                        type="button" 
                        onClick={() => setPreviewImage(null)}
                        className="absolute top-2 right-2 bg-rose-500 text-white p-2 rounded-xl shadow-lg hover:bg-rose-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5"/></svg>
                      </button>
                    </div>
                  )}
                  <label htmlFor="file-upload" className="w-full flex items-center justify-center p-6 border-2 border-dashed border-indigo-100 rounded-3xl cursor-pointer hover:bg-indigo-50/50 transition-all">
                    <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">
                      {previewImage ? 'Change Item Imagery' : 'Upload Item Imagery'}
                    </span>
                  </label>
                </div>
              </div>
              <div className="col-span-2 flex justify-end gap-6 pt-6">
                <button type="button" onClick={() => { setIsModalOpen(false); setPreviewImage(null); }} className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Dismiss</button>
                <button type="submit" className="px-12 py-5 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Submit to Registry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
