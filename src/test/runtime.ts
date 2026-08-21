export class DataSourceWithBackend {
  uid = '';

  constructor(instanceSettings: { uid?: string }) {
    this.uid = instanceSettings.uid ?? '';
  }

  async getResource(): Promise<unknown> {
    return undefined;
  }
}

export function getTemplateSrv() {
  return {
    replace: (value: string | undefined) => value ?? '',
  };
}
