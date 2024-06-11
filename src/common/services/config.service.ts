import * as dotenv from 'dotenv';

export class ConfigService {
  private readonly envConfig: { [key: string]: string } = {};

  constructor() {
    const result = dotenv.config();
    if (!result.error) {
      this.envConfig = result.parsed;
    }
  }

  get(key: string): string {
    return this.envConfig[key];
  }
}
