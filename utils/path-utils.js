/**
 * Cross-platform path utilities
 * This file provides helper functions to handle path differences between Windows and Mac/Linux
 */

const path = require('path');
const os = require('os');

/**
 * Determines if the current system is Windows
 * @returns {boolean} True if running on Windows
 */
const isWindows = () => {
  return os.platform() === 'win32';
};

/**
 * Converts a path to use the correct separators for the current OS
 * @param {string} filePath - Path to normalize
 * @returns {string} Path with correct separators
 */
const normalizePath = (filePath) => {
  return path.normalize(filePath);
};

/**
 * Joins path segments using the correct separator for the current OS
 * @param {...string} paths - Path segments to join
 * @returns {string} Joined path
 */
const joinPaths = (...paths) => {
  return path.join(...paths);
};

/**
 * Resolves path to absolute path using the correct separator for the current OS
 * @param {...string} paths - Path segments to resolve
 * @returns {string} Absolute path
 */
const resolvePath = (...paths) => {
  return path.resolve(...paths);
};

/**
 * Gets the directory name from a path
 * @param {string} filePath - Path to get directory from
 * @returns {string} Directory name
 */
const getDirName = (filePath) => {
  return path.dirname(filePath);
};

module.exports = {
  isWindows,
  normalizePath,
  joinPaths,
  resolvePath,
  getDirName
}; 