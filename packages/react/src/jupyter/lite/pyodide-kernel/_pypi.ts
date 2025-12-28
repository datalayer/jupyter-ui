// Wheel URLs must be full HTTP URLs for micropip to recognize as remote
// We construct them at runtime using the origin

// Helper to get the base URL - works in both main thread and workers
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  if (typeof self !== 'undefined' && 'location' in self) {
    return (self as any).location.origin;
  }
  return '';
}

// Export as namespace objects with default property to match the original API
// The URLs are getters so they're resolved at runtime
export const allJSONUrl = {
  get default() {
    return `${getBaseUrl()}/pypi/all.json`;
  },
};
export const ipykernelWheelUrl = {
  get default() {
    return `${getBaseUrl()}/pypi/ipykernel-6.9.2-py3-none-any.whl`;
  },
};
export const pipliteWheelUrl = {
  get default() {
    return `${getBaseUrl()}/pypi/piplite-0.5.1-py3-none-any.whl`;
  },
};
export const pyodide_kernelWheelUrl = {
  get default() {
    return `${getBaseUrl()}/pypi/pyodide_kernel-0.5.1-py3-none-any.whl`;
  },
};
export const widgetsnbextensionWheelUrl = {
  get default() {
    return `${getBaseUrl()}/pypi/widgetsnbextension-3.6.999-py3-none-any.whl`;
  },
};
export const widgetsnbextensionWheelUrl1 = {
  get default() {
    return `${getBaseUrl()}/pypi/widgetsnbextension-4.0.999-py3-none-any.whl`;
  },
};
