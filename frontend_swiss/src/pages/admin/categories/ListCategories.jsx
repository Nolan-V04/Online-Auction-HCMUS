import { useState } from "react";
import { useLoaderData } from "react-router";
import { Link, Form } from "react-router";

import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function ListCategories() {
  const { records } = useLoaderData();
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleDeleteClick = function (category) {
    setDeleteConfirm(category);
  };

  const hideDeleteConfirmDialog = () => {
    setDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-12">
      {/* Header */}
      <div className="w-full max-w-4xl mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#1E293B] tracking-tight">
              Categories
            </h1>
            <p className="text-[#64748B] mt-2">
              Manage your category list
            </p>
          </div>
          <Link
            to="/admin/categories/add"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
            aria-label="Add new category"
          >
            <Plus className="w-5 h-5" />
            Add Category
          </Link>
        </div>
      </div>

      {/* Table Container */}
      <div className="w-full max-w-4xl bg-white border border-[#E2E8F0] overflow-hidden px-8 shadow-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2E8F0]">
              <th className="text-left px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                ID
              </th>
              <th className="text-left px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                Name
              </th>
              <th className="text-right px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {records && records.categories.length > 0 ? (
              records.categories.map(category => (
                <tr
                  key={category.catid}
                  className="group hover:bg-[#F8FAFC] transition-colors duration-200"
                >
                  <td className="px-8 py-2 text-sm text-[#64748B] text-left">
                    {category.catid}
                  </td>
                  <td className="px-8 py-2 text-base text-[#64748B] text-left">
                    {category.catname}
                  </td>
                  <td className="px-8 py-2 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {/* Edit Button */}
                      <Link
                        to={`/admin/categories/edit/${category.catid}`}
                        className="inline-flex items-center justify-center w-9 h-9 border border-[#E2E8F0] bg-white hover:bg-[#3B82F6] hover:border-[#3B82F6] text-[#64748B] hover:text-white transition-all duration-200 cursor-pointer group/btn shadow-sm hover:shadow-md"
                        aria-label={`Edit ${category.name}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteClick(category)}
                        className="inline-flex items-center justify-center w-9 h-9 border border-[#E2E8F0] bg-white hover:bg-[#EF4444] hover:border-[#EF4444] text-[#64748B] hover:text-white transition-all duration-200 cursor-pointer group/btn shadow-sm hover:shadow-md"
                        aria-label={`Delete ${category.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="3"
                  className="px-8 py-12 text-center text-[#94A3B8]"
                >
                  No categories found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#EF4444] px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Confirm Delete
              </h2>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6">
              <p className="text-[#475569] text-base">
                Are you sure you want to delete the category{' '}
                <span className="font-semibold text-[#1E293B]">
                  "{deleteConfirm.catname}"
                </span>
                ?
              </p>
              <p className="text-[#94A3B8] text-sm mt-2">
                This action cannot be undone.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#F8FAFC] px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={hideDeleteConfirmDialog}
                className="px-5 py-2.5 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#64748B] font-medium transition-all duration-200 cursor-pointer shadow-sm"
              >
                Cancel
              </button>
              <Form method="post" onSubmit={hideDeleteConfirmDialog}>
                <input
                  type="hidden"
                  name="intent"
                  value="delete"
                />
                <input
                  type="hidden"
                  name="catid"
                  value={deleteConfirm.catid}
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white font-medium transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
                >
                  Delete
                </button>
              </Form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}