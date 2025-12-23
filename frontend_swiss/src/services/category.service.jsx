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

export async function fetchCategoryTree() {
  const res = await instance.get('/categories/tree');
  if (res.status === 200) {
    // API returns { result_code, result_message, categories }
    if (res.data && Array.isArray(res.data.categories)) return res.data.categories;
    // Backwards-compatible: maybe the endpoint returned an array directly
    if (Array.isArray(res.data)) return res.data;
    throw new Error('Unexpected response from category tree: ' + JSON.stringify(res.data));
  } else {
    throw new Error('Failed to fetch category tree');
  }
}