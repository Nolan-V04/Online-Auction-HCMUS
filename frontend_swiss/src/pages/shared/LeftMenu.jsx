import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchCategoryTree } from '@/services/category.service.jsx';

// Debug: log module load (helps detect import/runtime errors)
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line no-console
  console.debug('LeftMenu module loaded');
}
import axios from 'axios';

export default function LeftMenu({ mobileOpen = false, onClose = () => {} }) {
  const [tree, setTree] = useState([]);
  const [open, setOpen] = useState({});
  const [fetchError, setFetchError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const qs = new URLSearchParams(location.search);
  const activeCat = qs.get('catid');

  // load function with retry and safe error handling
  async function loadTree() {
    setFetchError(null);
    try {
      const data = await fetchCategoryTree();
      const list = data || [];
      // auto-open parent if active category is present in query
      if (activeCat) {
        const map = {};
        list.forEach(p => {
          if (p.children && p.children.some(c => String(c.catid) === String(activeCat))) {
            map[p.catid] = true;
          }
        });
        setTree(list);
        setOpen(map);
      } else {
        setTree(list);
      }
      // debug
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('LeftMenu loaded tree', list);
      }
    } catch (err) {
      // record error and keep UI alive
      setFetchError(err?.message || String(err));
      // eslint-disable-next-line no-console
      console.error('LeftMenu fetch error', err);
      setTree([]);
    }
  }

  useEffect(() => {
    let mounted = true;
    // call loadTree (it is safe internally)
    if (mounted) loadTree();
    return () => { mounted = false };
  }, [activeCat]);

  function toggle(id) {
    setOpen(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function goToCategory(catid) {
    // navigate to products page filtered by category; adapt if you have a dedicated route
    navigate(`/products?catid=${catid}`);
  }

  return (
    <>
      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white p-4 shadow-lg overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Danh mục</h3>
              <button onClick={onClose} className="text-gray-600">✕</button>
            </div>
            {fetchError ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-700">Menu failed to load.</p>
                <p className="text-xs text-gray-600">{fetchError}</p>
                <div className="mt-2">
                  <button onClick={loadTree} className="text-sm text-blue-600">Retry</button>
                </div>
              </div>
            ) : (
              <ul className="space-y-2">
                {tree.map(parent => (
                  <li key={parent.catid}>
                    <button onClick={() => toggle(parent.catid)} className="w-full flex items-center justify-between text-left text-gray-800 font-medium hover:text-blue-600">
                      <span>{parent.catname} <small className="text-xs text-gray-500 ml-2">({parent.count ?? 0})</small></span>
                      <span className="ml-2">{open[parent.catid] ? '▾' : '▸'}</span>
                    </button>
                    {open[parent.catid] && parent.children && parent.children.length > 0 && (
                      <ul className="mt-2 ml-4 space-y-1">
                        {parent.children.map(child => (
                          <li key={child.catid}>
                            <button onClick={() => { goToCategory(child.catid); onClose(); }} className={`text-sm ${String(child.catid) === String(activeCat) ? 'text-blue-600 font-semibold' : 'text-gray-600'} hover:text-blue-600`}>{child.catname} <small className="text-xs text-gray-400 ml-2">({child.count ?? 0})</small></button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 px-4">
        <div className="sticky top-20">
          <h3 className="text-lg font-semibold mb-2">Danh mục</h3>
          {fetchError ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-700">Menu failed to load.</p>
              <p className="text-xs text-gray-600">{fetchError}</p>
              <div className="mt-2">
                <button onClick={loadTree} className="text-sm text-blue-600">Retry</button>
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {tree.map(parent => (
                <li key={parent.catid}>
                  <button onClick={() => toggle(parent.catid)} className="w-full flex items-center justify-between text-left text-gray-800 font-medium hover:text-blue-600">
                    <span>{parent.catname} <small className="text-xs text-gray-500 ml-2">({parent.count ?? 0})</small></span>
                    <span className="ml-2">{open[parent.catid] ? '▾' : '▸'}</span>
                  </button>
                  {open[parent.catid] && parent.children && parent.children.length > 0 && (
                    <ul className="mt-2 ml-4 space-y-1">
                      {parent.children.map(child => (
                        <li key={child.catid}>
                          <button onClick={() => goToCategory(child.catid)} className={`text-sm ${String(child.catid) === String(activeCat) ? 'text-blue-600 font-semibold' : 'text-gray-600'} hover:text-blue-600`}>{child.catname} <small className="text-xs text-gray-400 ml-2">({child.count ?? 0})</small></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
