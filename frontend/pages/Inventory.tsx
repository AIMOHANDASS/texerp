
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Product, Category } from '../types';
import anime from 'animejs';

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const tableRef = useRef(null);

  const fetchProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      anime({
        targets: '.inventory-row',
        opacity: [0, 1],
        translateY: [20, 0],
        delay: anime.stagger(50),
        easing: 'easeOutExpo'
      });
    }
  }, [products, searchTerm, categoryFilter]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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
      image: editingProduct?.image || `https://picsum.photos/seed/${Date.now()}/200/200`
    };
    
    await api.saveProduct(productData);
    await fetchProducts();
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const deleteProduct = async (id: string) => {
    if (window.confirm("Delete this product?")) {
      await api.deleteProduct(id);
      await fetchProducts();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Product Inventory</h3>
          <p className="text-slate-500 text-sm">Manage and track your textile catalog.</p>
        </div>
        <div className="flex gap-3">
           <button onClick={() => api.downloadReport('inventory', filteredProducts)} className="px-5 py-2.5 text-slate-600 glass-card rounded-xl hover:bg-white shadow-sm transition-all border border-slate-200">
            Export CSV
          </button>
          <button onClick={() => setIsModalOpen(true)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-xl transition-all font-semibold active:scale-95">
            + New Product
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 glass-card rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative col-span-1 md:col-span-2">
          <svg className="absolute left-3 top-3 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search by product name or SKU..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="All">All Categories</option>
          {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <div className="glass-card rounded-3xl border border-slate-200 overflow-hidden shadow-2xl">
        <table className="w-full text-left" ref={tableRef}>
          <thead className="bg-slate-50/50 border-b border-slate-200">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product details</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing (INR)</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Level</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.map(p => (
              <tr key={p.id} className="inventory-row group hover:bg-white/80 transition-all opacity-0">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <img src={p.image} className="h-12 w-12 rounded-2xl object-cover ring-4 ring-slate-100 group-hover:ring-indigo-50 transition-all shadow-sm" />
                    <div>
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.variant}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-sm text-slate-600 font-mono tracking-tighter">{p.sku}</td>
                <td className="px-8 py-5 text-sm"><span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase tracking-wider">{p.category}</span></td>
                <td className="px-8 py-5 text-sm">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-xs">Buy: ₹{p.costPrice}</span>
                    <span className="font-black text-emerald-600">Sell: ₹{p.sellingPrice}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${p.stock < 10 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${p.stock < 10 ? 'bg-rose-600' : 'bg-emerald-600'}`}></div>
                    {p.stock} in inventory
                  </div>
                </td>
                <td className="px-8 py-5 text-right space-x-3">
                  <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900 font-bold text-xs uppercase tracking-widest">Edit</button>
                  <button onClick={() => deleteProduct(p.id)} className="text-rose-500 hover:text-rose-700 font-bold text-xs uppercase tracking-widest">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <div className="p-20 text-center text-slate-400 italic">No products found matching your search.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-3xl font-black text-slate-800 mb-8 tracking-tighter">{editingProduct ? 'Update Product' : 'New Catalog Item'}</h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-4">
                <input name="name" placeholder="Product Title" defaultValue={editingProduct?.name} required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold" />
                <div className="grid grid-cols-2 gap-4">
                  <select name="category" defaultValue={editingProduct?.category} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-semibold">
                    {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <input name="sku" placeholder="SKU ID" defaultValue={editingProduct?.sku} required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-semibold" />
                </div>
                <input name="variant" placeholder="Variant (e.g. Linen Blue / Large)" defaultValue={editingProduct?.variant} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-semibold" />
                <div className="grid grid-cols-3 gap-4">
                  <input type="number" name="costPrice" placeholder="Cost" defaultValue={editingProduct?.costPrice} required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-semibold" />
                  <input type="number" name="sellingPrice" placeholder="Retail" defaultValue={editingProduct?.sellingPrice} required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-semibold" />
                  <input type="number" name="stock" placeholder="Initial Qty" defaultValue={editingProduct?.stock} required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-semibold" />
                </div>
                <textarea name="description" placeholder="Product Details..." defaultValue={editingProduct?.description} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl h-32 font-medium"></textarea>
              </div>
              <div className="flex justify-end gap-4 pt-6">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingProduct(null); }} className="px-8 py-3 text-slate-500 font-bold hover:text-slate-800 transition-all">Dismiss</button>
                <button type="submit" className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">Submit to Registry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
