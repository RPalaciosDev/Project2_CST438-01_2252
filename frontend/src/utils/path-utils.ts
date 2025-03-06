/**
 * Cross-platform path utilities for React Native
 * This file provides helper functions to handle path differences between platforms
 */

import { Platform } from 'react-native';

/**
 * Determines if the current system is Windows
 * @returns {boolean} True if running on Windows
 */
export const isWindows = (): boolean => {
  if (Platform.OS === 'web') {
    // For web platform, check the navigator userAgent
    return typeof navigator !== 'undefined' && /Win/i.test(navigator.userAgent);
  }
  // React Native mobile platforms aren't Windows
  return false;
};

/**
 * Normalizes a path according to the platform
 * @param {string} filePath - Path to normalize
 * @returns {string} Normalized path
 */
export const normalizePath = (filePath: string): string => {
  // Convert backslashes to forward slashes for consistency
  return filePath.replace(/\\/g, '/');
};

/**
 * Joins path segments using forward slashes for cross-platform compatibility
 * @param {string[]} paths - Path segments to join
 * @returns {string} Joined path
 */
export const joinPaths = (...paths: string[]): string => {
  // Filter out empty segments
  const filteredPaths = paths.filter(p => p && p.length > 0);
  
  // Join with forward slashes and remove any duplicated slashes
  return filteredPaths
    .join('/')
    .replace(/\/+/g, '/');
};

/**
 * Gets the directory name from a path
 * @param {string} filePath - Path to get directory from
 * @returns {string} Directory name
 */
export const getDirName = (filePath: string): string => {
  const normalizedPath = normalizePath(filePath);
  const lastSlashIndex = normalizedPath.lastIndexOf('/');
  
  if (lastSlashIndex === -1) {
    return '';
  }
  
  return normalizedPath.substring(0, lastSlashIndex);
};

/**
 * Gets the file extension
 * @param {string} filePath - Path to get extension from
 * @returns {string} File extension (without the dot)
 */
export const getFileExtension = (filePath: string): string => {
  const normalizedPath = normalizePath(filePath);
  const lastDotIndex = normalizedPath.lastIndexOf('.');
  
  if (lastDotIndex === -1) {
    return '';
  }
  
  return normalizedPath.substring(lastDotIndex + 1);
}; 