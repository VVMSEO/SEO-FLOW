import React, { useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { Button } from '../ui/Button';
import { Trash2 } from 'lucide-react';

export default function Categories() {
  const { categories, addCategory, deleteCategory } = useCategories();
  const [newCatName, setNewCatName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory({ name: newCatName.trim(), color: '#18181b' });
    setNewCatName('');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 flex flex-col h-full font-sans">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Категории</h1>
      
      <div className="bg-white p-8 rounded-3xl border border-zinc-200/60 shadow-sm">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 mb-6">Добавить категорию</h2>
        <form onSubmit={handleAdd} className="flex gap-4">
          <input 
            type="text"
            className="flex-1 px-4 py-3 border border-zinc-200 rounded-xl shadow-sm focus:border-zinc-500 focus:ring-zinc-500 transition-colors bg-zinc-50 focus:bg-white"
            placeholder="Название категории..."
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
          />
          <Button type="submit" className="bg-zinc-900 hover:bg-zinc-800 text-white min-w-[140px] rounded-xl shadow-sm">
            + Добавить
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200/60 shadow-sm overflow-hidden flex-1">
        <table className="w-full text-sm text-left">
          <thead className="text-xs font-bold text-zinc-400 uppercase tracking-wider bg-zinc-50 border-b border-zinc-100">
            <tr>
              <th className="px-6 py-4">Название</th>
              <th className="px-6 py-4 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-zinc-50/80 transition-colors">
                <td className="px-6 py-4 font-semibold text-zinc-900">{cat.name}</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => deleteCategory(cat.id)}
                    className="text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors p-2 rounded-full"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={2} className="px-6 py-12 text-center text-zinc-400 font-medium">Нет категорий</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
