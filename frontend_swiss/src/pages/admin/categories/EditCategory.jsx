import { Link, Form, useLoaderData } from 'react-router';
import { ArrowLeft, Save, X } from 'lucide-react';

export default function EditCategory() {
  const { record } = useLoaderData();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-12">
      {/* Header */}
      <div className="w-full max-w-4xl mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-[#1E293B] tracking-tight">
              Edit Category
            </h1>
            <p className="text-[#64748B] mt-2">
              Update category information
            </p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="w-full max-w-4xl bg-white border border-[#E2E8F0] shadow-lg">
        <Form className="p-8" method='post'>
          {/* Category ID Field (Read-only) */}
          <div className="mb-6">
            <label
              htmlFor="catid"
              className="block text-sm font-bold text-[#64748B] uppercase tracking-wider mb-4"
            >
              Category ID
            </label>
            <input
              type="text"
              name="catid"
              id="catid"
              value={record?.category.catid || ''}
              className="w-full px-4 py-3 border border-[#E2E8F0] bg-[#F1F5F9] text-[#64748B] cursor-not-allowed"
              placeholder="Category ID"
              readOnly
            />
          </div>

          {/* Category Name Field */}
          <div className="mb-8">
            <label
              htmlFor="catname"
              className="block text-sm font-bold text-[#64748B] uppercase tracking-wider mb-4"
            >
              Category Name
            </label>
            <input
              type="text"
              name="catname"
              id="catname"
              defaultValue={record?.category.catname || ''}
              className="w-full px-4 py-3 border border-[#E2E8F0] bg-white text-[#1E293B] focus:outline-none focus:border-[#3B82F6] transition-colors duration-200"
              placeholder="Enter category name"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Link
              to="/admin/categories"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
              aria-label="Back to categories"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
            >
              <Save className="w-5 h-5" />
              Update Category
            </button>
            <button
              type="reset"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#64748B] font-medium transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
            >
              <X className="w-5 h-5" />
              Reset
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}