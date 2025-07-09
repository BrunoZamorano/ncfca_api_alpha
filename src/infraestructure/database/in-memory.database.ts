import Transaction from '@/domain/entities/transaction/transaction';
import Family from '@/domain/entities/family/family';
import Club from '@/domain/entities/club/club';
import User from '@/domain/entities/user/user';

export default class InMemoryDatabase {
  public readonly users: User[] = [];
  public readonly clubs: Club[] = [];
  public readonly families: Family[] = [];
  public readonly transactions: Transaction[] = [];
  private isTransactionActive = false;
  private transactionBackup: string | null = null;
  private static instance: InMemoryDatabase;

  private constructor() {}

  public static getInstance(): InMemoryDatabase {
    if (!InMemoryDatabase.instance) InMemoryDatabase.instance = new InMemoryDatabase();
    return InMemoryDatabase.instance;
  }

  public reset(): void {
    this.users.length = 0;
    this.clubs.length = 0;
    this.families.length = 0;
    this.transactions.length = 0;
    this.isTransactionActive = false;
    this.transactionBackup = null;
  }

  public beginTransaction(): void {
    if (this.isTransactionActive) throw new Error('Transaction already active');
    this.isTransactionActive = true;
    this.transactionBackup = JSON.stringify({
      users: this.users,
      clubs: this.clubs,
      families: this.families,
      transactions: this.transactions,
    });
    return void 0;
  }

  public commit(): void {
    if (!this.isTransactionActive) throw new Error('Any transaction active');
    this.isTransactionActive = false;
    this.transactionBackup = null;
    return void 0;
  }

  public rollback(): void {
    if (!this.isTransactionActive) return void 0;
    const restoredState = JSON.parse(this.transactionBackup!);
    this.users.splice(0, this.users.length, ...restoredState.users);
    this.clubs.splice(0, this.clubs.length, ...restoredState.clubs);
    this.families.splice(0, this.families.length, ...restoredState.families);
    this.transactions.splice(0, this.transactions.length, ...restoredState.transactions);
    this.isTransactionActive = false;
    this.transactionBackup = null;
    return void 0;
  }
}
