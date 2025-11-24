export class Cache {
  private cache: Map<string, string> = new Map();

  get(key: string): string | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: string): void {
    this.cache.set(key, value);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  getCacheKey(projectId: string, docName: string): string {
    return `${projectId}:${docName}`;
  }
}

