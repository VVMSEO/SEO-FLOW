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
    addCategory({ name: newCatName.trim(), color: '#3b82f6' });
    setNewCatName('');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 flex flex-col h-full">
      <h1 className="text-2xl font-bold text-slate-900">Категории</h1>
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Добавить категорию</h2>
        <form onSubmit={handleAdd} className="flex gap-4">
          <input 
            type="text"
            className="flex-1 px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Название категории..."
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
          />
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
            + Добавить
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1">
        <table className="w-full text-sm text-left">
          <thead className="text-xs font-semibold text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Название</th>
              <th className="px-6 py-4 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">{cat.name}</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => deleteCategory(cat.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-slate-500">Нет категорий</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
