import { Injectable } from '@nestjs/common';
import { mockBillingSnapshot } from '../data/mock-data';

@Injectable()
export class AccountService {
  getBillingSnapshot(): typeof mockBillingSnapshot {
    return mockBillingSnapshot;
  }
}
