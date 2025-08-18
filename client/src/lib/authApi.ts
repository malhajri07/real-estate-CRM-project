// Enhanced API client with authentication headers for role-based access

export async function authenticatedRequest(endpoint: string, options: RequestInit = {}) {
  const authToken = localStorage.getItem("authToken");
  const userStr = localStorage.getItem("currentUser");
  
  if (!authToken || !userStr) {
    throw new Error("Authentication required");
  }

  const user = JSON.parse(userStr);
  
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${authToken}`,
    "x-user-id": user.id,
    "x-tenant-id": user.tenantId,
    ...options.headers,
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid, redirect to login
    localStorage.removeItem("currentUser");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userLevel");
    localStorage.removeItem("tenantId");
    window.location.href = "/login";
    throw new Error("Authentication expired");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response;
}

export async function apiGet(endpoint: string) {
  const response = await authenticatedRequest(endpoint);
  return response.json();
}

export async function apiPost(endpoint: string, data: any) {
  const response = await authenticatedRequest(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function apiPut(endpoint: string, data: any) {
  const response = await authenticatedRequest(endpoint, {
    method: "PUT", 
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function apiDelete(endpoint: string) {
  const response = await authenticatedRequest(endpoint, {
    method: "DELETE",
  });
  return response.json();
}