import axios from "axios";

const instance = axios.create({
  baseURL: 'http://localhost:3000/api/',
  timeout: 20000,
  headers: { 'apiKey': '12345ABCDE' }
});

