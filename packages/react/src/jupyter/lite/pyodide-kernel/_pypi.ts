// Wheel URLs extracted from pypi/all.json
// These are full HTTP URLs that micropip can fetch
// Inlined to avoid webpack/bundler issues with JSON imports

// The all.json content inlined as a TypeScript object
// This should match the content of ./pypi/all.json
const allJson = {
  ipykernel: {
    releases: {
      '6.9.2': [
        {
          url: 'https://assets.datalayer.tech/pypi/ipykernel-6.9.2-py3-none-any.whl',
        },
      ],
    },
  },
  piplite: {
    releases: {
      '0.5.1': [
        {
          url: 'https://assets.datalayer.tech/pypi/piplite-0.5.1-py3-none-any.whl',
        },
      ],
    },
  },
  'pyodide-kernel': {
    releases: {
      '0.5.1': [
        {
          url: 'https://assets.datalayer.tech/pypi/pyodide_kernel-0.5.1-py3-none-any.whl',
        },
      ],
    },
  },
  widgetsnbextension: {
    releases: {
      '3.6.999': [
        {
          url: 'https://assets.datalayer.tech/pypi/widgetsnbextension-3.6.999-py3-none-any.whl',
        },
      ],
      '4.0.999': [
        {
          url: 'https://assets.datalayer.tech/pypi/widgetsnbextension-4.0.999-py3-none-any.whl',
        },
      ],
    },
  },
} as const;

// Type for the all.json structure
interface AllJsonRelease {
  url: string;
  [key: string]: unknown;
}

interface AllJsonPackage {
  releases: {
    [version: string]: AllJsonRelease[];
  };
}

interface AllJson {
  [packageName: string]: AllJsonPackage;
}

// Get the wheel URL for a package and version
function getWheelUrl(packageName: string, version?: string): string {
  const pkg = (allJson as unknown as AllJson)[packageName];
  if (!pkg) {
    console.error('all.json contents:', allJson);
    console.error('Looking for package:', packageName);
    throw new Error(`Package ${packageName} not found in all.json`);
  }
  const versions = Object.keys(pkg.releases);
  const targetVersion = version || versions[versions.length - 1];
  const releases = pkg.releases[targetVersion];
  if (!releases || releases.length === 0) {
    throw new Error(`No releases found for ${packageName}@${targetVersion}`);
  }
  return releases[0].url;
}

// Export the all.json URL (from CDN for piplite to fetch package index)
export const allJSONUrl = {
  default:
    allJson['piplite']?.releases['0.5.1']?.[0]?.url?.replace(
      /piplite-.*\.whl$/,
      'all.json'
    ) || 'https://assets.datalayer.tech/pypi/all.json',
};

// Export wheel URLs - read directly from imported JSON
export const pipliteWheelUrl = {
  default: getWheelUrl('piplite', '0.5.1'),
};

export const ipykernelWheelUrl = {
  default: getWheelUrl('ipykernel', '6.9.2'),
};

export const pyodide_kernelWheelUrl = {
  default: getWheelUrl('pyodide-kernel', '0.5.1'),
};

export const widgetsnbextensionWheelUrl = {
  default: getWheelUrl('widgetsnbextension', '3.6.999'),
};

export const widgetsnbextensionWheelUrl1 = {
  default: getWheelUrl('widgetsnbextension', '4.0.999'),
};
