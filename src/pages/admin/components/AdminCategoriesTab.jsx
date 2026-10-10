import React from 'react';
import {
  Tag, Sparkles, FolderPlus, ImageIcon, Plus, RefreshCw, Pencil, Trash2, X, AlertTriangle
} from 'lucide-react';

/**
 * AdminCategoriesTab Component
 * Handles adding, editing, and deleting product categories with thumbnail previews.
 */
export default function AdminCategoriesTab({
  categoriesWithDetails = [],
  allProducts = [],
  newCategoryInput,
  setNewCategoryInput,
  newCategoryImageInput,
  setNewCategoryImageInput,
  isAddingCategory,
  handleAddCategorySubmit,
  editingCategory,
  setEditingCategory,
  editCategoryNameInput,
  setEditCategoryNameInput,
  editCategoryImageInput,
  setEditCategoryImageInput,
  isSavingCategoryEdit,
  handleOpenEditCategory,
  handleSaveCategoryEditSubmit,
  categoryToDelete,
  setCategoryToDelete,
  handleDeleteCategoryConfirm
}) {
  return (
    <div className="space-y-8">
      {/* Category Management Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <Tag size={20} className="text-brand" /> Product Categories Management
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Add new product categories, update category names or images. Changes sync live across the Marketplace and Vendor shops.
          </p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200/80 px-4 py-2 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <Sparkles size={14} className="text-brand" />
          Total Categories: {categoriesWithDetails.length}
        </div>
      </div>

      {/* Add New Category Form */}
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 md:p-6 space-y-4">
        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
          <FolderPlus size={16} className="text-emerald-600" /> Add New Category
        </h4>
        <form onSubmit={handleAddCategorySubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                required
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                placeholder="Category Name (e.g. Exotic Herbs, Dry Fruits...)"
                className="w-full bg-white border border-slate-200 pl-10 pr-4 py-3 rounded-2xl focus:border-brand outline-none text-xs font-semibold shadow-xs"
              />
            </div>
            <div className="relative">
              <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={newCategoryImageInput}
                onChange={(e) => setNewCategoryImageInput(e.target.value)}
                placeholder="Image URL (e.g. https://images.unsplash.com/... or /path.png)"
                className="w-full bg-white border border-slate-200 pl-10 pr-4 py-3 rounded-2xl focus:border-brand outline-none text-xs font-semibold shadow-xs"
              />
            </div>
          </div>

          {newCategoryImageInput.trim() && (
            <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 w-fit">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Image Preview:</span>
              <img
                src={newCategoryImageInput}
                alt="Preview"
                className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&q=80'; }}
              />
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isAddingCategory || !newCategoryInput.trim()}
              className="bg-brand hover:bg-brand-dark text-white px-6 py-3 rounded-2xl font-extrabold text-xs transition-all shadow-md shadow-brand/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
            >
              {isAddingCategory ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Add Category</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* List of Existing Categories */}
      <div>
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 pl-1">
          Active Categories ({categoriesWithDetails.length})
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categoriesWithDetails.map((catObj, idx) => {
            const productCount = allProducts.filter(p => p.category === catObj.name).length;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200/80 hover:border-emerald-300 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                    <img
                      src={catObj.image || '/cherry_tomatoes.png'}
                      alt={catObj.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&q=80'; }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-extrabold text-gray-900 text-xs truncate group-hover:text-emerald-700 transition-colors">
                      {catObj.name}
                    </h5>
                    <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">
                      {productCount} product{productCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditCategory(catObj)}
                    className="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white flex items-center justify-center transition-all active:scale-90"
                    title={`Edit ${catObj.name} category & image`}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryToDelete(catObj.name)}
                    className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-all active:scale-90"
                    title={`Delete ${catObj.name} category`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Pencil size={18} className="text-emerald-600" /> Edit Category
              </h4>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategoryEditSubmit} className="space-y-4">
              {/* Current image preview */}
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-200 flex-shrink-0">
                  <img
                    src={editCategoryImageInput || '/cherry_tomatoes.png'}
                    alt="Category Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&q=80'; }}
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Category Preview</span>
                  <span className="text-sm font-extrabold text-slate-800">{editCategoryNameInput || 'Category Name'}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Category Name</label>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    required
                    value={editCategoryNameInput}
                    onChange={(e) => setEditCategoryNameInput(e.target.value)}
                    className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-2xl focus:border-brand outline-none text-xs font-semibold"
                    placeholder="Category Name"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Category Image URL</label>
                <div className="relative">
                  <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={editCategoryImageInput}
                    onChange={(e) => setEditCategoryImageInput(e.target.value)}
                    className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-2xl focus:border-brand outline-none text-xs font-semibold"
                    placeholder="https://images.unsplash.com/... or /path.png"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-2xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCategoryEdit || !editCategoryNameInput.trim()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-2xl text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingCategoryEdit ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-5 animate-scale-up text-center">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-gray-900">Delete Category?</h4>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-gray-900">"{categoryToDelete}"</span>? Products currently using this category will remain, but vendors won't be able to select it for new products.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-2xl text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCategoryConfirm(categoryToDelete)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-2xl text-xs transition-all shadow-md shadow-red-500/20 active:scale-95"
              >
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
