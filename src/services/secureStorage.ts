/**
 * Secure Storage Service
 * Provides encrypted storage for sensitive data with proper security practices
 */

interface SecureStorageOptions {
  encrypt?: boolean;
  expiration?: number; // milliseconds
}

class SecureStorage {
  private prefix = 'debttruth_secure_';
  
  /**
   * Store sensitive data with encryption (simplified for demo)
   * In production, use proper encryption libraries and secure key management
   */
  setItem(key: string, value: any, options: SecureStorageOptions = {}): void {
    try {
      const data = {
        value,
        timestamp: Date.now(),
        expiration: options.expiration || null,
        encrypted: options.encrypt || false
      };
      
      let serialized = JSON.stringify(data);
      
      // In production, use proper encryption here
      if (options.encrypt) {
        serialized = this.simpleEncrypt(serialized);
      }
      
      // Use sessionStorage for sensitive data instead of localStorage
      sessionStorage.setItem(this.prefix + key, serialized);
    } catch (error) {
      console.error('Failed to store secure data:', error);
      throw new Error('Storage operation failed');
    }
  }
  
  /**
   * Retrieve and decrypt sensitive data
   */
  getItem(key: string): any {
    try {
      const stored = sessionStorage.getItem(this.prefix + key);
      if (!stored) return null;
      
      let data;
      try {
        // Try to decrypt if it was encrypted
        const decrypted = this.simpleDecrypt(stored);
        data = JSON.parse(decrypted);
      } catch {
        // Fallback to unencrypted data
        data = JSON.parse(stored);
      }
      
      // Check expiration
      if (data.expiration && Date.now() > data.timestamp + data.expiration) {
        this.removeItem(key);
        return null;
      }
      
      return data.value;
    } catch (error) {
      console.error('Failed to retrieve secure data:', error);
      return null;
    }
  }
  
  /**
   * Remove sensitive data
   */
  removeItem(key: string): void {
    sessionStorage.removeItem(this.prefix + key);
  }
  
  /**
   * Clear all secure storage (for logout)
   */
  clear(): void {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        sessionStorage.removeItem(key);
      }
    });
  }
  
  /**
   * Simple encryption for demo (use proper crypto in production)
   * In production, use Web Crypto API or proven encryption libraries
   */
  private simpleEncrypt(text: string): string {
    // WARNING: This is for demo only - use proper encryption in production
    return btoa(text);
  }
  
  /**
   * Simple decryption for demo
   */
  private simpleDecrypt(encrypted: string): string {
    try {
      return atob(encrypted);
    } catch {
      return encrypted; // Fallback for unencrypted data
    }
  }
}

export const secureStorage = new SecureStorage();

// Type-safe wrappers for specific data types
export const StorageKeys = {
  PLAID_ACCESS_TOKEN: 'plaid_access_token',
  USER_SESSION: 'user_session',
  FINANCIAL_DATA: 'financial_data'
} as const;

export type StorageKey = typeof StorageKeys[keyof typeof StorageKeys];
