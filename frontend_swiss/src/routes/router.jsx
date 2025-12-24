import { createBrowserRouter, redirect } from "react-router";

import * as categoryService from "@/services/category.service.jsx";

import App from '@/App.jsx'

import AdminLayout from "@/pages/admin/AdminLayout.jsx";
import ListCategories from "@/pages/admin/categories/ListCategories.jsx";
import AddCategory from "@/pages/admin/categories/AddCategory.jsx";
import EditCategory from "@/pages/admin/categories/EditCategory.jsx";
import RootLayout from "@/pages/shared/RootLayout.jsx";
import Login from "@/pages/shared/signin.jsx";
import ProductsList from "@/pages/guest/ProductsList.jsx";
import Signup from "@/pages/shared/Signup"; 
import ProductDetail from "@/pages/shared/itemdetails.jsx";

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
        path: "/admin",
        element: <AdminLayout />,
        children: [
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
              if (intent === "delete") {
                const catid = formData.get("catid");
                const res = await categoryService.deleteCategory(catid);
                return res.data;
              }

              return null;
            },
            element: <ListCategories />,
          },
          {
            path: "categories/add",
            element: <AddCategory />,
            action: async ({ request }) => {
              const formData = await request.formData();
              const data = Object.fromEntries(formData.entries());

              if (data.catname.length === 0) {
                return { error: "Category name is required." };
              }

              const res = await categoryService.createCategory(data);
              return res.category;
            },
          },
          {
            path: "categories/edit/:catid",
            element: <EditCategory />,
            loader: async function ({ params }) {
              return {
                record: await categoryService.fetchCategoryById(params.catid)
              };
            },
            action: async function ({ request, params }) {
              const formData = await request.formData();
              const data = Object.fromEntries(formData.entries());
              await categoryService.updateCategory(params.catid, data);
              return redirect('/admin/categories');
            },
          }
        ]
      }
    ]
  }
]);

export default router;