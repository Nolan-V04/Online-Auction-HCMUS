import { Link } from 'react-router'
import { LayoutGrid, Info, Activity, ArrowRight } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-8">
      {/* Hero Section */}
      <div className="max-w-3xl w-full text-center space-y-8">
        {/* Main Heading */}
        <div className="space-y-4">
          <h1 className="text-6xl font-semibold text-[#1E293B] tracking-tight leading-tight">
            Swiss Admin
          </h1>
          <p className="text-xl text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            Clean, minimal, and functional admin interface following Swiss design principles
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 mb-12">
          <div className="bg-white border border-[#E2E8F0] p-8 shadow-md transition-shadow duration-200 hover:shadow-lg">
            <div className="w-12 h-12 bg-[#3B82F6] flex items-center justify-center mb-4 mx-auto">
              <LayoutGrid className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-medium text-[#1E293B] mb-2">Grid Based</h3>
            <p className="text-sm text-[#64748B]">Mathematical spacing and modular grid system</p>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-8 shadow-md transition-shadow duration-200 hover:shadow-lg">
            <div className="w-12 h-12 bg-[#3B82F6] flex items-center justify-center mb-4 mx-auto">
              <Info className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-medium text-[#1E293B] mb-2">Minimal</h3>
            <p className="text-sm text-[#64748B]">Essential elements only, high clarity</p>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-8 shadow-md transition-shadow duration-200 hover:shadow-lg">
            <div className="w-12 h-12 bg-[#3B82F6] flex items-center justify-center mb-4 mx-auto">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-medium text-[#1E293B] mb-2">Functional</h3>
            <p className="text-sm text-[#64748B]">Form follows function, no decoration</p>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-8">
          <Link to="/admin/categories"
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium text-lg transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
          >
            View Categories
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Footer */}
        <div className="pt-16 pb-8">
          <p className="text-sm text-[#94A3B8]">
            Built with React · Tailwind CSS · Swiss Design Principles
          </p>
        </div>
      </div>
    </div>
  );
}

export default App
