import { createBrowserRouter, redirect } from "react-router";

import * as categoryService from "@/services/category.service.jsx";

import App from '@/App.jsx'

import AdminLayout from "@/pages/admin/AdminLayout.jsx";
import ListCategories from "@/pages/admin/categories/ListCategories.jsx";
import AddCategory from "@/pages/admin/categories/AddCategory.jsx";
import EditCategory from "@/pages/admin/categories/EditCategory.jsx";
import AdminHome from "@/pages/admin/AdminHome.jsx";
import AdminProducts from "@/pages/admin/AdminProducts.jsx";
import AdminUsers from "@/pages/admin/AdminUsers.jsx";
import AdminSellerRequests from "@/pages/admin/AdminSellerRequests.jsx";
import RootLayout from "@/pages/shared/RootLayout.jsx";
import Login from "@/pages/shared/signin.jsx";
import ProductsList from "@/pages/guest/ProductsList.jsx";
import Signup from "@/pages/shared/Signup"; 
import ProductDetail from "@/pages/shared/itemdetails.jsx";
import WatchlistPage from "@/pages/shared/WatchlistPage.jsx";
import ProfilePage from "@/pages/shared/Profile.jsx";
import SellerProducts from "@/pages/seller/SellerProducts.jsx";

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <App />,
      },
      {
        path: "/products",
        element: <ProductsList />,
      },
      {
        path: "/signin",
        element: <Login />,
      },
      {
        path: "/signup",
        element: <Signup />,
      },
      {
        path: "/products/detail/:proid",
        element: <ProductDetail />,
      },
      {
        path: "/watchlist",
        element: <WatchlistPage />,
      },
      {
        path: "/profile",
        element: <ProfilePage />,
      },
      {
        path: "/seller/products",
        element: <SellerProducts />,
      },
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { path: '', element: <AdminHome /> },
          {
            path: "categories",
            loader: async function () {
              return {
                records: await categoryService.fetchCategories()
              };
            },
            action: async ({ request }) => {
              const formData = await request.formData();
              const intent = formData.get("intent");
              
              if (intent === "add") {
                const catname = formData.get("catname");
                const parent_id = formData.get("parent_id");
                const res = await categoryService.addCategory({ 
                  catname, 
                  parent_id: parent_id || null 
                });
                return { success: true, data: res.data };
              }
              
              if (intent === "update") {
                const catid = formData.get("catid");
                const catname = formData.get("catname");
                const parent_id = formData.get("parent_id");
                const res = await categoryService.updateCategory(catid, { 
                  catname, 
                  parent_id: parent_id || null 
                });
                return { success: true, data: res.data };
              }
              
              if (intent === "delete") {
                const catid = formData.get("catid");
                try {
                  const res = await categoryService.deleteCategory(catid);
                  return { success: true, data: res.data };
                } catch (error) {
                  // Return error message to display in UI
                  return {
                    error: true,
                    message: error.response?.data?.result_message || 'Không thể xóa danh mục'
                  };
                }
              }

              return null;
            },
            element: <ListCategories />,
          },
          { path: "categories/add", element: <AddCategory /> },
          { path: "categories/edit/:catid", element: <EditCategory /> },
          { path: "products", element: <AdminProducts /> },
          { path: "users", element: <AdminUsers /> },
          { path: "seller-requests", element: <AdminSellerRequests /> }
        ]
      }
    ]
  }
]);

export default router;