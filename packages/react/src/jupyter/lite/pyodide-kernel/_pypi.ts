// Wheel URLs dynamically extracted from all.json
// These are full HTTP URLs that micropip can fetch

// Import the local all.json file
import allJson from './pypi/all.json';

// Type for the all.json structure
interface AllJsonRelease {
  url: string;
  filename: string;
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
  const pkg = (allJson as AllJson)[packageName];
  if (!pkg) {
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
    (allJson as AllJson)['piplite']?.releases['0.5.1']?.[0]?.url?.replace(
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
