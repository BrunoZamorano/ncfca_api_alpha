export interface Queue {
  consume(event: string, callback: Function): Promise<void>;
  publish(event: string, data: any): Promise<void>;
  connect(): Promise<void>;
}
