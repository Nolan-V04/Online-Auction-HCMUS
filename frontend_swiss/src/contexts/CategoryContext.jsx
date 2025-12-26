import { createContext, useContext, useState } from 'react';

const CategoryContext = createContext();

export function CategoryProvider({ children }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <CategoryContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategoryRefresh() {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategoryRefresh must be used within CategoryProvider');
  }
  return context;
}
