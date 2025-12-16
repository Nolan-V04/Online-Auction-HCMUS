import axios from "axios";

const instance = axios.create({
  baseURL: 'http://localhost:3000/api/',
  timeout: 20000,
  headers: { 'apiKey': '12345ABCDE' }
});

export async function fetchCategories() {
  const res = await instance.get("/categories");
  if (res.status === 200) {
    return res.data;
  } else {
    throw new Error("Failed to fetch categories");
  }
}

export async function createCategory(data) {
  const res = await instance.post("/categories", data);
  if (res.status === 201) {
    return res.data;
  } else {
    throw new Error("Failed to create category");
  }
}

export async function deleteCategory(catid) {
  const res = await instance.delete(`/categories/${catid}`);
  if (res.status === 200) {
    return res.data;
  } else {
    throw new Error("Failed to delete category");
  }
}

export async function fetchCategoryById(catid) {
  const res = await instance.get(`/categories/${catid}`);
  if (res.status === 200) {
    return res.data;
  } else {
    throw new Error("Failed to fetch category");
  }
}

export async function updateCategory(catid, data) {
  const res = await instance.patch(`/categories/${catid}`, data);
  if (res.status === 200) {
    return res.data;
  } else {
    throw new Error("Failed to update category");
  }
}