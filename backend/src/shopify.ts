import axios from 'axios';

export function shopifyClient(domain: string, token: string) {
  return axios.create({
    baseURL: `https://${domain}/admin/api/2024-10`,
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: 30000,
  });
}
